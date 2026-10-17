import Dexie, { type Table } from "dexie";

export type AccountType = "银行卡" | "支付宝/微信" | "现金" | "基金" | "股票" | "信用卡" | "其他资产" | "其他负债";
export type EntryType = "收入" | "支出" | "转账";
export interface Account { id: string; name: string; type: AccountType; balance: number; lastFour?: string; note?: string; createdAt: string; }
export interface Entry { id: string; type: EntryType; amount: number; accountId: string; targetAccountId?: string; category: string; note?: string; date: string; createdAt: string; }

class MoneyDatabase extends Dexie {
  accounts!: Table<Account, string>;
  entries!: Table<Entry, string>;
  constructor() { super("myLittleMoney"); this.version(1).stores({ accounts: "id,type,name,createdAt", entries: "id,type,accountId,targetAccountId,date,createdAt" }); }
}
export const db = new MoneyDatabase();
export const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const liabilityTypes: AccountType[] = ["信用卡", "其他负债"];
export const isLiability = (type: AccountType) => liabilityTypes.includes(type);
export const supportsCardNumber = (type: AccountType) => ["银行卡", "信用卡"].includes(type);

export async function addEntry(entry: Omit<Entry, "id" | "createdAt">) {
  if (!entry.amount || entry.amount <= 0) throw new Error("金额必须大于 0");
  if (entry.type === "转账" && (!entry.targetAccountId || entry.targetAccountId === entry.accountId)) throw new Error("请选择不同的转入账户");
  await db.transaction("rw", db.accounts, db.entries, async () => {
    const source = await db.accounts.get(entry.accountId); if (!source) throw new Error("原账户不存在");
    const delta = entry.type === "收入" ? entry.amount : -entry.amount;
    await db.accounts.update(source.id, { balance: source.balance + delta });
    if (entry.type === "转账") { const target = await db.accounts.get(entry.targetAccountId!); if (!target) throw new Error("转入账户不存在"); await db.accounts.update(target.id, { balance: target.balance + entry.amount }); }
    await db.entries.add({ ...entry, id: id(), createdAt: new Date().toISOString() });
  });
}

export async function seedDemo() {
  const legacyDemoIds = new Set(["bank", "wallet", "cash", "fund", "card"]);
  const existing = await db.accounts.toArray();
  const retiredDemoIds = existing.filter(a => legacyDemoIds.has(a.id) && a.id !== "bank").map(a => a.id);
  if (retiredDemoIds.length) {
    await db.transaction("rw", db.accounts, db.entries, async () => {
      const allEntries = await db.entries.toArray();
      await db.entries.bulkDelete(allEntries.filter(e => retiredDemoIds.includes(e.accountId) || (e.targetAccountId && retiredDemoIds.includes(e.targetAccountId))).map(e => e.id));
      await db.accounts.bulkDelete(retiredDemoIds);
    });
  }
  if (await db.accounts.count()) return;
  const now = new Date().toISOString();
  const a: Account[] = [
    { id: "bank", name: "我的储蓄卡", type: "银行卡", balance: 28650, lastFour: "8888", createdAt: now }
  ];
  await db.accounts.bulkAdd(a);
  const month = new Date().toISOString().slice(0, 7);
  await db.entries.bulkAdd([
    { id: id(), type: "收入", amount: 12500, accountId: "bank", category: "工资", note: "演示数据", date: `${month}-05`, createdAt: now },
    { id: id(), type: "支出", amount: 2650, accountId: "bank", category: "房租", note: "演示数据", date: `${month}-03`, createdAt: now },
    { id: id(), type: "支出", amount: 328, accountId: "bank", category: "餐饮", note: "工作日午餐", date: `${month}-08`, createdAt: now }
  ]);
}

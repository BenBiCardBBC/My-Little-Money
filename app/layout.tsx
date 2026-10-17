import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "我的小金库", description: "本地优先的个人资产管理工具" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body>{children}</body></html>; }

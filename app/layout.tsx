import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Line Studio · 多人歌曲分词工作台",
  description: "为组合、乐队、翻唱团队与自定义阵容安排歌词，编辑时间与合唱，比较分配方案并导出结果。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}

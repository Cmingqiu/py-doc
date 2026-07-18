import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeInitializer from "@/components/theme/ThemeInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PyDoc - Python 可视化学习",
  description: "通过动画交互，直观展示 Python 逻辑与程序流转",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="forest"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('pydoc-theme');
                  const theme = stored ? JSON.parse(stored).state.currentTheme : 'forest';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'forest');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col relative">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}

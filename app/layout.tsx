import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Content Automation - Explainer Video Studio',
  description: 'Generate dynamic 9:16 explainer videos with Flow MCP & HyperFrames',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#0B0D14] text-slate-100 antialiased min-h-screen">
        <header className="border-b border-slate-800 bg-[#0F121C]/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-cyan-500/20">
              CA
            </div>
            <div>
              <span className="font-bold tracking-tight text-white">Content Automation</span>
              <span className="text-xs text-slate-400 ml-2 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">Explainer Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Flow MCP + HyperFrames
            </span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}


import Link from "next/link";
import { getSourceCategories } from "@/lib/sources";

export default function HomePage() {
  const categories = getSourceCategories();

  const categoryLabels: Record<string, string> = {
    basics: "基础语法",
    functions: "函数",
    "data-structures": "数据结构",
  };

  const categoryIcons: Record<string, string> = {
    basics: "🐍",
    functions: "⚡",
    "data-structures": "🧱",
  };

  return (
    <main className="relative z-10 flex-1 px-6 py-12 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          PyDoc
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          通过动画交互，直观展示 Python 逻辑与程序流转
        </p>
        <div className="mt-6 h-px w-48 mx-auto bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>

      {/* Categories */}
      <div className="space-y-10">
        {Object.entries(categories).map(([cat, files]) => (
          <section key={cat}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{categoryIcons[cat] || "📁"}</span>
              <h2 className="text-xl font-semibold text-slate-200">
                {categoryLabels[cat] || cat}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((file) => (
                <Link
                  key={file.slug}
                  href={`/learn/${file.slug}`}
                  className="glow-card p-5 flex flex-col gap-2"
                >
                  <h3 className="text-base font-semibold text-slate-100">
                    {file.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {file.description}
                  </p>
                  <div className="mt-auto pt-3 flex items-center gap-2">
                    <span className="category-badge">{cat}</span>
                    <span className="text-xs text-slate-500">
                      {file.steps.steps.length} 步
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-slate-600">
        PyDoc — Python 可视化学习工具
      </footer>
    </main>
  );
}

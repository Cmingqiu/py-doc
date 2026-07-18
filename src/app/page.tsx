import Link from "next/link";
import { getSourceCategories } from "@/lib/sources";
import ThemePicker from "@/components/theme/ThemePicker";

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
      {/* Theme picker - fixed top right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemePicker />
      </div>

      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          PyDoc
        </h1>
        <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          通过动画交互，直观展示 Python 逻辑与程序流转
        </p>
        <div className="mt-6 h-px w-48 mx-auto" style={{
          background: `linear-gradient(to right, transparent, var(--accent-primary), transparent)`,
          opacity: 0.5
        }} />
      </div>

      {/* Categories */}
      <div className="space-y-10">
        {Object.entries(categories).map(([cat, files]) => (
          <section key={cat}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{categoryIcons[cat] || "📁"}</span>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {categoryLabels[cat] || cat}
              </h2>
              <div className="flex-1 h-px" style={{
                background: `linear-gradient(to right, var(--accent-primary), transparent)`,
                opacity: 0.3
              }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((file) => (
                <Link
                  key={file.slug}
                  href={`/learn/${file.slug}`}
                  className="glow-card p-5 flex flex-col gap-2"
                >
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {file.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {file.description}
                  </p>
                  <div className="mt-auto pt-3 flex items-center gap-2">
                    <span className="category-badge">{cat}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
      <footer className="mt-20 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        PyDoc — Python 可视化学习工具
      </footer>
    </main>
  );
}

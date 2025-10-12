export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-6xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Code Insight
        </h1>
        <p className="text-xl text-center mb-12 text-gray-600 dark:text-gray-300">
          AI-Powered Code Review, Debugging & Architecture Analysis
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition">
            <h2 className="text-2xl font-semibold mb-4">🔍 Code Review</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Get instant AI-powered code reviews with actionable feedback
            </p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition">
            <h2 className="text-2xl font-semibold mb-4">🐛 Debug Doctor</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Automatically detect and fix bugs with intelligent suggestions
            </p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition">
            <h2 className="text-2xl font-semibold mb-4">🏗️ Architecture</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Generate scalable architecture designs for your projects
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-16">
          <button className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold">
            Get Started
          </button>
          <button className="px-8 py-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold">
            View Docs
          </button>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-100">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-blue-400">
          GPIOS Enterprise Platform
        </h1>
        <p className="text-lg text-slate-300">
          Sprint 0 — Engineering Infrastructure & Foundation Established
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-sm text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Engineering Infrastructure Online
        </div>
      </div>
    </main>
  );
}

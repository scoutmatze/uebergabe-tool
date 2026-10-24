export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <p className="text-dpsg-red font-bold tracking-widest uppercase text-sm">DPSG</p>
        <h1 className="text-4xl md:text-5xl font-bold text-dpsg-blue mt-2">Übergabe</h1>
        <p className="mt-4 text-lg text-neutral-600">
          Amtsübergabe per Sprachnachricht – pro Themenkomplex aufgenommen,
          automatisch zu Stichpunkten verdichtet, jederzeit durchsuchbar.
        </p>
        <a
          href="/dashboard"
          className="inline-block mt-8 rounded-lg bg-dpsg-blue px-6 py-3 text-white font-bold hover:opacity-90 transition"
        >
          Loslegen
        </a>
        <p className="mt-10 text-xs text-neutral-400">Fundament-Build · v0.1</p>
      </div>
    </main>
  );
}

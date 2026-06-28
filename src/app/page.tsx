import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#c8e2e6] px-6 text-center">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(204,228,231,0.68)_34%,rgba(132,190,199,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(70,132,150,0.18)_0%,rgba(255,255,255,0.45)_32%,rgba(255,255,255,0.5)_68%,rgba(73,137,150,0.22)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-2/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.2)_58%,rgba(255,255,255,0)_100%)]" />

      <section className="relative z-10 flex w-full max-w-5xl translate-y-8 flex-col items-center">
        <div className="relative mb-28 w-full">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[#1e5b8e]/70" />

          <h1 className="relative mx-auto bg-transparent text-[clamp(4rem,12vw,9rem)] font-normal italic tracking-[0.18em] text-[#174b84] drop-shadow-[0_0_8px_rgba(255,255,255,0.75)] [font-family:Georgia,Times_New_Roman,serif]">
            GNOSIA
          </h1>
        </div>

        <nav className="flex flex-col items-center gap-8">
          <Link
            href="/create-room"
            className="group min-w-64 px-8 py-2 text-[#6f5d4c] transition hover:text-[#264d72]"
          >
            <span className="block text-base tracking-[0.28em] text-white/85 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
              ルーム作成
            </span>

            <span className="block text-3xl font-light tracking-[0.14em] [font-family:Arial_Narrow,Arial,sans-serif]">
              CREATE ROOM
            </span>

            <span className="mt-1 block h-px scale-x-0 bg-white/80 transition group-hover:scale-x-100" />
          </Link>

          <Link
            href="/join-room"
            className="group min-w-64 px-8 py-2 text-[#6f5d4c] transition hover:text-[#264d72]"
          >
            <span className="block text-base tracking-[0.28em] text-white/85 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
              ルーム参加
            </span>

            <span className="block text-3xl font-light tracking-[0.14em] [font-family:Arial_Narrow,Arial,sans-serif]">
              JOIN ROOM
            </span>

            <span className="mt-1 block h-px scale-x-0 bg-white/80 transition group-hover:scale-x-100" />
          </Link>
        </nav>
      </section>
    </main>
  );
}

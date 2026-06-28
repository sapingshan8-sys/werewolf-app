import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-sky-200">
      <h1 className="text-5xl font-bold text-blue-700">
        GNOSIA
      </h1>

      <Link
        href="/create-room"
        className="rounded border border-sky-300 bg-sky-200 px-6 py-3 font-semibold text-amber-900 hover:bg-sky-300"
      >
        ルーム作成
      </Link>

      <Link
        href="/join-room"
        className="rounded border border-sky-300 bg-sky-200 px-6 py-3 font-semibold text-amber-900 hover:bg-sky-300"
      >
        ルーム参加
      </Link>
    </main>
  );
}

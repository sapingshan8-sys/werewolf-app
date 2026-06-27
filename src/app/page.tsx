import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">
        人狼オンライン
      </h1>

      <Link
        href="/create-room"
        className="rounded bg-blue-500 px-6 py-3 text-white"
      >
        ルーム作成
      </Link>

      <Link
        href="/join-room"
        className="rounded bg-green-500 px-6 py-3 text-white"
      >
        ルーム参加
      </Link>
    </main>
  );
}
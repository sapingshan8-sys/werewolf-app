"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, set, push } from "firebase/database";
import { setPlayerSession } from "@/lib/playerSession";

export default function CreateRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const router = useRouter();

  const createRoom = async () => {
    if (playerName.trim() === "") {
      alert("プレイヤー名を入力してください");
      return;
    }

    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";

    for (let i = 0; i < 8; i++) {
      code += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    try {
      // 先にプレイヤーIDだけ作る
      const playerRef = push(
        ref(db, `rooms/${code}/players`)
      );

      const playerId = playerRef.key!;

      // ルーム作成
      await set(ref(db, `rooms/${code}`), {
        status: "waiting",
        createdAt: Date.now(),
        hostId: playerId,
      });

      // ホスト登録
      await set(playerRef, {
        name: playerName,
        joinedAt: Date.now(),
        ready: false,
      });

      // ブラウザ保存
      setPlayerSession(code, playerId);

      setRoomCode(code);

      alert("ルームを作成しました");

      router.push(`/room/${code}`);
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#c8e2e6] px-6 text-center">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(204,228,231,0.68)_36%,rgba(132,190,199,0.74)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(70,132,150,0.18)_0%,rgba(255,255,255,0.5)_32%,rgba(255,255,255,0.5)_68%,rgba(73,137,150,0.22)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-2/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.18)_58%,rgba(255,255,255,0)_100%)]" />

      <section className="relative z-10 w-full max-w-md">
        <div className="relative mb-12">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[#1e5b8e]/55" />

          <h1 className="relative text-5xl font-normal italic tracking-[0.18em] text-[#174b84] drop-shadow-[0_0_8px_rgba(255,255,255,0.75)] [font-family:Georgia,Times_New_Roman,serif]">
            CREATE
          </h1>
        </div>

        <div className="rounded-sm border border-white/50 bg-white/22 px-8 py-10 shadow-[0_0_36px_rgba(255,255,255,0.26)] backdrop-blur-sm">
          <p className="mb-8 text-sm tracking-[0.3em] text-white/90 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">
            ルーム作成
          </p>

          <input
            type="text"
            placeholder="プレイヤー名"
            value={playerName}
            onChange={(e) =>
              setPlayerName(e.target.value)
            }
            className="mb-7 block w-full border-0 border-b border-[#1e5b8e]/45 bg-white/20 px-4 py-3 text-center text-[#6f5d4c] outline-none placeholder:text-[#6f5d4c]/55 focus:border-[#174b84]"
          />

          <button
            onClick={createRoom}
            className="group w-full px-8 py-3 text-[#6f5d4c] transition hover:text-[#264d72]"
          >
            <span className="block text-sm tracking-[0.28em] text-white/85 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
              コード発行
            </span>

            <span className="block text-3xl font-light tracking-[0.14em] [font-family:Arial_Narrow,Arial,sans-serif]">
              START
            </span>

            <span className="mx-auto mt-1 block h-px w-48 scale-x-0 bg-white/80 transition group-hover:scale-x-100" />
          </button>

          {roomCode && (
            <div className="mt-8 text-[#6f5d4c]">
              <p className="text-sm tracking-[0.24em] text-white/85">
                ルームコード
              </p>

              <p className="mt-2 text-3xl tracking-[0.16em]">
                {roomCode}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

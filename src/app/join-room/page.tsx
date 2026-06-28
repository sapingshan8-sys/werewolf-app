"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, get, push, set } from "firebase/database";
import { setPlayerSession } from "@/lib/playerSession";

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const router = useRouter();

  const joinRoom = async () => {
    // 入力チェック
    if (roomCode.trim() === "") {
      alert("ルームコードを入力してください");
      return;
    }

    if (playerName.trim() === "") {
      alert("プレイヤー名を入力してください");
      return;
    }

    try {
      // ルーム存在確認
      const roomRef = ref(db, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        alert("ルームが存在しません");
        return;
      }

      // プレイヤー登録
      const playerRef = push(
        ref(db, `rooms/${roomCode}/players`)
      );

      await set(playerRef, {
        name: playerName,
        joinedAt: Date.now(),
        ready: false,
      });

      // ブラウザ保存
      setPlayerSession(
        roomCode,
        playerRef.key ?? ""
      );

      alert("入室成功");

      // ロビーへ移動
      router.push(`/room/${roomCode}`);

    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
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
            JOIN
          </h1>
        </div>

        <div className="rounded-sm border border-white/50 bg-white/22 px-8 py-10 shadow-[0_0_36px_rgba(255,255,255,0.26)] backdrop-blur-sm">
          <p className="mb-8 text-sm tracking-[0.3em] text-white/90 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">
            ルーム参加
          </p>

          <input
            type="text"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value.toUpperCase()
              )
            }
            placeholder="ルームコード"
            className="mb-6 block w-full border-0 border-b border-[#1e5b8e]/45 bg-white/20 px-4 py-3 text-center text-[#6f5d4c] tracking-[0.18em] outline-none placeholder:text-[#6f5d4c]/55 focus:border-[#174b84]"
          />

          <input
            type="text"
            value={playerName}
            onChange={(e) =>
              setPlayerName(e.target.value)
            }
            placeholder="プレイヤー名"
            className="mb-7 block w-full border-0 border-b border-[#1e5b8e]/45 bg-white/20 px-4 py-3 text-center text-[#6f5d4c] outline-none placeholder:text-[#6f5d4c]/55 focus:border-[#174b84]"
          />

          <button
            onClick={joinRoom}
            className="group w-full px-8 py-3 text-[#6f5d4c] transition hover:text-[#264d72]"
          >
            <span className="block text-sm tracking-[0.28em] text-white/85 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
              入室
            </span>

            <span className="block text-3xl font-light tracking-[0.14em] [font-family:Arial_Narrow,Arial,sans-serif]">
              ENTER
            </span>

            <span className="mx-auto mt-1 block h-px w-48 scale-x-0 bg-white/80 transition group-hover:scale-x-100" />
          </button>
        </div>
      </section>
    </main>
  );
}

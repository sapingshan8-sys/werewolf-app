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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        ルーム作成
      </h1>

      <input
        type="text"
        placeholder="プレイヤー名"
        value={playerName}
        onChange={(e) =>
          setPlayerName(e.target.value)
        }
        className="border p-2 mb-4 block"
      />

      <button
        onClick={createRoom}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        コード発行
      </button>

      {roomCode && (
        <div className="mt-6">
          <p>ルームコード</p>
          <p className="text-2xl font-bold">
            {roomCode}
          </p>
        </div>
      )}
    </div>
  );
}

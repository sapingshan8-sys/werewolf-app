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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        ルーム参加
      </h1>

      <div className="mb-4">
        <input
          type="text"
          value={roomCode}
          onChange={(e) =>
            setRoomCode(
              e.target.value.toUpperCase()
            )
          }
          placeholder="ルームコード"
          className="border p-2"
        />
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) =>
            setPlayerName(e.target.value)
          }
          placeholder="プレイヤー名"
          className="border p-2"
        />
      </div>

      <button
        onClick={joinRoom}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        入室
      </button>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { getRoles } from "@/lib/roles";
import { shuffle } from "@/lib/shuffle";
import { getPlayerSession } from "@/lib/playerSession";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();

  const roomCode = params.roomCode as string;

  const [players, setPlayers] = useState<PlayerWithId[]>([]);
  const [hostId, setHostId] = useState("");
  const [myPlayerId] = useState(() =>
    getPlayerSession().playerId
  );

  useEffect(() => {
    // ルーム情報監視
    const roomRef = ref(db, `rooms/${roomCode}`);

    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const room = snapshot.val();

      if (!room) return;

      setHostId(room.hostId);

      if (room.status === "playing") {
        router.push(`/game/${roomCode}`);
      }
    });

    // プレイヤー一覧監視
    const playersRef = ref(db, `rooms/${roomCode}/players`);

    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setPlayers([]);
        return;
      }

      const playerList: PlayerWithId[] = Object.entries(data).map(
        ([id, value]) => ({
          id,
          ...(value as Player),
        })
      );

      setPlayers(playerList);
    });

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
    };
  }, [roomCode, router]);

  // 自分
  const me = players.find(
    (player) => player.id === myPlayerId
  );

  // 全員準備完了？
  const allReady =
    players.length > 0 &&
    players.every((player) => player.ready);

  // キャラクター選択
  const goCharacterSelect = () => {
    router.push("/character-select");
  };

  // ゲーム開始
  const startGame = async () => {
    try {
      // 人数に応じた役職一覧取得
      const roles = getRoles(players.length);

      if (roles.length !== players.length) {
        alert(
          `${players.length}人用の役職設定がありません`
        );
        return;
      }

      // シャッフル
      const shuffledRoles = shuffle(roles);

      // 各プレイヤーへ役職を保存
      for (let i = 0; i < players.length; i++) {
        await update(
          ref(
            db,
            `rooms/${roomCode}/players/${players[i].id}`
          ),
          {
            role: shuffledRoles[i],
            alive: true,
          }
        );
      }

      // ゲーム開始
        await update(ref(db, `rooms/${roomCode}`), {
          status: "playing",
          phase: "roleReveal",
        });

      alert("役職を配布しました！");
    } catch (error) {
      console.error(error);
      alert("ゲーム開始に失敗しました");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        ルーム：{roomCode}
      </h1>

      <h2 className="text-xl font-semibold mb-4">
        参加者一覧（{players.length}人）
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {players.map((player) => (
          <div
            key={player.id}
            className="border rounded-xl p-4 flex flex-col items-center shadow-sm"
          >
            <Image
              src={
                player.character
                  ? `/characters/${player.character}.png`
                  : "/characters/question.png"
              }
              alt={player.character ?? "未選択"}
              width={100}
              height={100}
              className="rounded-lg"
            />

            <p className="mt-3 text-lg font-semibold">
              {player.name}
            </p>

            <p className="text-sm text-gray-500">
              {player.character ?? "未選択"}
            </p>

            <p className="mt-2">
              {player.ready
                ? "✅ 準備完了"
                : "⏳ 準備中"}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={goCharacterSelect}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
      >
        {me?.ready
          ? "キャラクター変更"
          : "キャラクター選択"}
      </button>

      {myPlayerId === hostId && allReady && (
        <button
          onClick={startGame}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          ゲーム開始
        </button>
      )}

      {!allReady && (
        <p className="mt-4 text-gray-600">
          全員の準備が完了するまでお待ちください。
        </p>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

const roleNames: Record<string, string> = {
  crew: "乗員",
  gnosia: "グノーシア",
  engineer: "エンジニア",
  doctor: "ドクター",
  guardianAngel: "守護天使",
  guardDuty: "留守番",
  acFollower: "AC主義者",
  bug: "バグ",
};

const phaseNames: Record<string, string> = {
  roleReveal: "役職確認",
  discussion: "議論",
  vote: "投票",
  sleep: "コールドスリープ",
  evening: "夕方",
  night: "夜",
  result: "ゲーム終了",
};

const phaseOrder = [
  "roleReveal",
  "discussion",
  "vote",
  "sleep",
  "evening",
  "night",
  "result",
];

export default function GamePage() {
  const params = useParams();

  const roomCode = params.roomCode as string;

  const [players, setPlayers] = useState<PlayerWithId[]>([]);
  const [myPlayerId] = useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("playerId") || ""
  );
  const [hostId, setHostId] = useState("");
  const [phase, setPhase] = useState("");

  useEffect(() => {
    // ルーム監視
    const roomRef = ref(db, `rooms/${roomCode}`);

    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const room = snapshot.val();

      if (!room) return;

      setPhase(room.phase ?? "");
      setHostId(room.hostId ?? "");
    });

    // プレイヤー監視
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
  }, [roomCode]);

  const me = players.find(
    (player) => player.id === myPlayerId
  );

  const nextPhase = async () => {
    const currentIndex = phaseOrder.indexOf(phase);

    if (currentIndex === -1) return;

    if (currentIndex >= phaseOrder.length - 1) {
      return;
    }

    const next = phaseOrder[currentIndex + 1];

    await update(ref(db, `rooms/${roomCode}`), {
      phase: next,
    });
  };

  if (!me) {
    return <div className="p-8">読み込み中...</div>;
  }

  const renderPlayerList = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {players
          .filter((player) => player.alive)
          .map((player) => (
            <div
              key={player.id}
              className="border rounded-xl p-4 text-center"
            >
              <Image
                src={`/characters/${player.character}.png`}
                alt={player.character ?? ""}
                width={120}
                height={120}
                className="mx-auto rounded-lg"
              />

              <p className="mt-3 font-bold">
                {player.name}
              </p>

              <p className="text-green-600">
                生存
              </p>
            </div>
          ))}
      </div>
    );
  };

  const renderPhaseContent = () => {
    switch (phase) {
      case "roleReveal":
        return (
          <div className="border rounded-xl p-6">

            <h2 className="text-2xl font-bold mb-4">
              あなたの役職
            </h2>

            <Image
              src={`/characters/${me.character}.png`}
              alt={me.character ?? ""}
              width={180}
              height={180}
              className="rounded-xl"
            />

            <p className="text-2xl font-bold mt-4">
              {me.name}
            </p>

            <p className="text-3xl text-blue-600 font-bold mt-4">
              {roleNames[me.role ?? ""] ?? "？？？"}
            </p>

          </div>
        );

      case "discussion":
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">
              議論フェーズ
            </h2>

            <p className="mb-6">
              怪しい人物について話し合いましょう。
            </p>

            {renderPlayerList()}
          </>
        );

      case "vote":
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">
              投票フェーズ
            </h2>

            <p className="mb-6">
              コールドスリープする人物を選びます。
            </p>

            {renderPlayerList()}
          </>
        );

      case "sleep":
        return (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold">
              コールドスリープ
            </h2>

            <p className="mt-6 text-xl">
              投票結果を集計しています...
            </p>
          </div>
        );

      case "evening":
        return (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold">
              夕方
            </h2>

            <p className="mt-6 text-xl">
              今日も一日が終わります。
            </p>
          </div>
        );

      case "night":
        return (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold">
              夜
            </h2>

            <p className="mt-6 text-xl">
              能力を使用するプレイヤーは行動してください。
            </p>
          </div>
        );

      case "result":
        return (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold">
              ゲーム終了
            </h2>

            <p className="mt-6 text-xl">
              勝敗を判定しています。
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-20">
            フェーズを読み込み中...
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        ゲーム開始
      </h1>

      <div className="border rounded-xl p-5 mb-8 bg-gray-50">
        <h2 className="text-xl font-bold">
          現在のフェーズ
        </h2>

        <p className="text-2xl text-red-600 font-bold mt-2">
          {phaseNames[phase] ?? phase}
        </p>
      </div>

      {myPlayerId === hostId && (
        <div className="mb-8">
          <button
            onClick={nextPhase}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            次のフェーズへ
          </button>
        </div>
      )}

      {renderPhaseContent()}

    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { getPlayerSession } from "@/lib/playerSession";

const characters = [
  { id: "yuri", name: "ユーリ" },
  { id: "setsu", name: "セツ" },
  { id: "SQ", name: "SQ" },
  { id: "jina", name: "ジナ" },
  { id: "racio", name: "ラキオ" },
  { id: "shigemichi", name: "しげみち" },
  { id: "stella", name: "ステラ" },
  { id: "yuriko", name: "夕里子" },
  { id: "comet", name: "コメット" },
  { id: "chipie", name: "シピ" },
  { id: "jonas", name: "ジョナス" },
  { id: "kukrushka", name: "ククルシカ" },
  { id: "remnan", name: "レムナン" },
  { id: "otome", name: "オトメ" },
  { id: "shaming", name: "沙明" },
];

export default function CharacterSelectPage() {
  const router = useRouter();

  const [selectedCharacter, setSelectedCharacter] =
    useState("");

  useEffect(() => {
    const loadCharacter = async () => {
      const { playerId, roomCode } =
        getPlayerSession();

      if (!playerId || !roomCode) return;

      const snapshot = await get(
        ref(
          db,
          `rooms/${roomCode}/players/${playerId}`
        )
      );

      if (snapshot.exists()) {
        const player = snapshot.val();
        setSelectedCharacter(
          player.character ?? ""
        );
      }
    };

    loadCharacter();
  }, []);

  const selectCharacter = async (
    character: string
  ) => {
    const { playerId, roomCode } =
      getPlayerSession();

    if (!playerId || !roomCode) {
      alert("プレイヤー情報がありません");
      return;
    }

    if (character === selectedCharacter) {
      alert("このキャラクターを選択中です");
      return;
    }

    try {
      await update(
        ref(
          db,
          `rooms/${roomCode}/players/${playerId}`
        ),
        {
          character,
          ready: true,
        }
      );

      alert("キャラクターを選択しました");

      router.push(`/room/${roomCode}`);
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        キャラクター選択
      </h1>

      {selectedCharacter && (
        <p className="mb-6 text-lg">
          現在選択中：
          <span className="font-bold text-green-600">
            {" "}
            {selectedCharacter}
          </span>
        </p>
      )}

      <div className="grid grid-cols-5 gap-6">
        {characters.map((character) => (
          <button
            key={character.id}
            onClick={() =>
              selectCharacter(character.id)
            }
            className={`rounded-xl border-4 p-3 transition
            ${
              selectedCharacter === character.id
                ? "border-green-500 bg-green-100"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-100"
            }`}
          >
            <Image
              src={`/characters/${character.id}.png`}
              alt={character.name}
              width={120}
              height={120}
              className="mx-auto rounded-lg"
            />

            <p className="mt-3 text-center font-semibold">
              {character.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

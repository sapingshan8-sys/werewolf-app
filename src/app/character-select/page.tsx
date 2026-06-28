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
    <main className="min-h-screen bg-[linear-gradient(180deg,#eeeeee_0%,#d9dcde_100%)] px-6 py-8 text-[#3e3b3b]">
      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.16)_0px,rgba(255,255,255,0.16)_2px,transparent_2px,transparent_7px)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="relative mb-10 inline-block bg-[#e6aa08]/95 px-8 py-3 pr-24 shadow-[0_0_0_4px_rgba(255,255,255,0.85)] [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)]">
          <h1 className="text-4xl font-light tracking-[0.08em]">
            選択して下さい
          </h1>

          <span className="absolute right-8 top-1 text-5xl font-semibold italic text-white/40 [font-family:Georgia,Times_New_Roman,serif]">
            SELECT
          </span>
        </div>

      {selectedCharacter && (
        <p className="mb-6 text-lg tracking-[0.08em]">
          現在選択中：
          <span className="font-bold text-[#1b78b7]">
            {" "}
            {selectedCharacter}
          </span>
        </p>
      )}

      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-3">
        {characters.map((character) => (
          <button
            key={character.id}
            onClick={() =>
              selectCharacter(character.id)
            }
            className={`group relative h-24 overflow-hidden text-left transition [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_36%)]
            ${
              selectedCharacter === character.id
                ? "bg-[#b7d6ee] shadow-[0_0_0_4px_rgba(210,225,0,0.95),0_0_0_8px_rgba(255,255,255,0.85)]"
                : "bg-white/82 shadow-[0_0_0_4px_rgba(255,255,255,0.86)] hover:bg-[#dcebf6]"
            }`}
          >
            <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden opacity-90">
              <Image
                src={`/characters/${character.id}.png`}
                alt={character.name}
                fill
                sizes="260px"
                className="object-cover object-center transition group-hover:scale-105"
              />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.9)_46%,rgba(255,255,255,0.08)_100%)]" />

            <div className="absolute inset-0 border-2 border-white/80 [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_36%)]" />

            <p className="relative z-10 ml-12 mt-5 text-3xl font-light tracking-[0.08em]">
              {character.name}
            </p>

            {selectedCharacter === character.id && (
              <p className="relative z-10 ml-12 mt-1 text-sm font-semibold tracking-[0.18em] text-[#1b78b7]">
                SELECTED
              </p>
            )}
          </button>
        ))}
      </div>
      </div>
    </main>
  );
}

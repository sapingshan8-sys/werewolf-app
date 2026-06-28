"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  onValue,
  push,
  ref,
  set,
} from "firebase/database";
import { db } from "@/lib/firebase";
import {
  configurableRoles,
  roleLabels,
  type RoleCounts,
} from "@/lib/roles";
import type { Player } from "@/types/player";
import VoteHistory from "../result/VoteHistory";

type PlayerWithId = Player & {
  id: string;
};

type Message = {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  createdAt: number;
};

type VoteHistoryDay = {
  day: number;
  order?: number;
  votes: {
    voterName: string;
    targetName: string;
  }[];
};

type Props = {
  roomCode: string;
  day: number;
  players: PlayerWithId[];
  myPlayer: PlayerWithId;
  isSpectator: boolean;
  roleCounts: RoleCounts;
  voteHistory: VoteHistoryDay[];
  voteStage?: string;
  runoffCandidates?: PlayerWithId[];
  canProceed?: boolean;
  onProceed?: () => Promise<void> | void;
};

export default function DiscussionPhase({
  roomCode,
  day,
  players,
  myPlayer,
  isSpectator,
  roleCounts,
  voteHistory,
  voteStage = "normal",
  runoffCandidates = [],
  canProceed = false,
  onProceed,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRolePanelOpen, setIsRolePanelOpen] =
    useState(false);
  const [isVoteHistoryOpen, setIsVoteHistoryOpen] =
    useState(false);
  const claimableRoles = configurableRoles.filter(
    (role) => (roleCounts[role] ?? 0) > 0
  );

  useEffect(() => {
    const messagesRef = ref(
      db,
      `rooms/${roomCode}/discussionChats/${day}/messages`
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setMessages([]);
        return;
      }

      const list: Message[] = Object.entries(data).map(
        ([id, value]) => ({
          id,
          ...(value as Omit<Message, "id">),
        })
      );

      list.sort((a, b) => a.createdAt - b.createdAt);

      setMessages(list);
    });

    return () => unsubscribe();
  }, [roomCode, day]);

  const sendMessage = async (text: string) => {
    const trimmedText = text.trim();

    if (trimmedText === "" || isSpectator) {
      return;
    }

    setIsSending(true);

    try {
      const messageRef = push(
        ref(
          db,
          `rooms/${roomCode}/discussionChats/${day}/messages`
        )
      );

      await set(messageRef, {
        playerId: myPlayer.id,
        playerName: myPlayer.name,
        text: trimmedText,
        createdAt: Date.now(),
      });
    } finally {
      setIsSending(false);
    }
  };

  const claimRole = async (role: string) => {
    await sendMessage(`[${roleLabels[role] ?? role}]CO`);
    setIsRolePanelOpen(false);
  };

  const submitMessage = async () => {
    const text = message.trim();

    if (text === "") {
      return;
    }

    await sendMessage(text);
    setMessage("");
  };

  return (
    <div className="relative -mx-8 -my-8 min-h-screen overflow-x-auto overflow-y-hidden bg-[#d4f0fb] px-8 py-8 text-[#222]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0_10%,transparent_10%_100%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-full bg-white/70 [clip-path:polygon(0_35%,100%_16%,100%_100%,0_100%)]" />
      <div className="pointer-events-none absolute bottom-20 left-0 h-2 w-full bg-white/85" />

      <div className="relative z-10 min-h-[calc(100vh-4rem)] min-w-[70rem]">
        <div className="absolute left-[-2rem] top-0 bg-white/95 px-12 py-8 pr-28 shadow-[0_0_0_4px_rgba(255,255,255,0.72)] [clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]">
          <h2 className="text-5xl font-black tracking-[0.08em]">
            会議中
          </h2>
        </div>

        {canProceed && onProceed && (
          <button
            type="button"
            onClick={onProceed}
            className="absolute left-[26rem] top-5 bg-[#8f8f8f] px-12 py-5 text-2xl font-bold text-white shadow-[0_0_0_5px_rgba(255,255,255,0.88),6px_6px_0_rgba(0,0,0,0.18)] transition hover:bg-[#777] [clip-path:polygon(10%_0,100%_0,92%_78%,75%_100%,0_96%,0_24%)]"
          >
            次のフェーズへ
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            setIsRolePanelOpen((current) => !current)
          }
          className="absolute right-0 top-24 w-64 bg-[#8f8f8f] px-8 py-7 text-4xl font-bold leading-tight text-white shadow-[0_0_0_5px_rgba(255,255,255,0.88),6px_6px_0_rgba(0,0,0,0.18)] transition hover:bg-[#777] [clip-path:polygon(12%_0,100%_0,100%_70%,85%_100%,0_94%,0_25%)]"
        >
          役割を
          <br />
          明かす
        </button>

        <button
          type="button"
          onClick={() =>
            setIsVoteHistoryOpen((current) => !current)
          }
          className="absolute right-72 top-72 w-56 bg-[#8f8f8f] px-8 py-7 text-4xl font-bold leading-tight text-white shadow-[0_0_0_5px_rgba(255,255,255,0.88),6px_6px_0_rgba(0,0,0,0.18)] transition hover:bg-[#777] [clip-path:polygon(12%_0,100%_0,100%_70%,85%_100%,0_94%,0_25%)]"
        >
          投票
          <br />
          結果
        </button>

      {voteStage === "runoff" && (
        <div className="absolute left-0 top-36 max-w-xl bg-white/80 p-5 shadow-[0_0_0_4px_rgba(255,255,255,0.8)] [clip-path:polygon(4%_0,100%_0,96%_100%,0_100%,0_18%)]">
          <h3 className="text-xl font-bold text-red-700">
            同票による再会議
          </h3>

          <p className="mt-2 text-gray-700">
            次の投票では、前回最多票だった人物の中から投票します。
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {runoffCandidates.map((player) => (
              <span
                key={player.id}
                className="rounded-full bg-white px-4 py-2 font-semibold text-red-700"
              >
                {player.name}
              </span>
            ))}
          </div>
        </div>
      )}

        <div className="absolute bottom-28 left-6 max-h-72 w-[min(58rem,calc(100vw-34rem))] overflow-y-auto pr-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-2xl text-[#5f5f5f]">
                まだメッセージはありません。
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="max-w-3xl bg-white/75 px-5 py-3 shadow-[0_0_0_3px_rgba(255,255,255,0.82)] [clip-path:polygon(3%_0,100%_0,97%_100%,0_100%,0_22%)]"
                >
                  <p className="font-bold text-[#2870a4]">
                    {message.playerName}
                  </p>

                  <p className="break-words text-xl">
                    {message.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {isRolePanelOpen && (
          <div className="absolute right-0 top-72 w-72 bg-white/85 p-5 shadow-[0_0_0_4px_rgba(255,255,255,0.84),6px_6px_0_rgba(0,0,0,0.12)]">
            <h3 className="mb-4 text-xl font-bold">
              CO
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {claimableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => claimRole(role)}
                  disabled={isSpectator || isSending}
                  className="bg-[#8f8f8f] px-3 py-2 font-semibold text-white transition hover:bg-[#777] disabled:bg-gray-300"
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>

            {claimableRoles.length === 0 && (
              <p className="text-gray-500">
                COできる役職を読み込み中です。
              </p>
            )}
          </div>
        )}

        {isVoteHistoryOpen && (
          <div className="absolute right-0 top-[28rem] max-h-[28rem] w-[34rem] overflow-y-auto bg-white/90 p-5 shadow-[0_0_0_4px_rgba(255,255,255,0.84),6px_6px_0_rgba(0,0,0,0.12)]">
            <VoteHistory history={voteHistory} />
          </div>
        )}

        <div className="absolute left-6 top-40 grid max-w-3xl grid-cols-3 gap-4">
          {players
            .filter((player) => player.alive !== false)
            .map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-white/65 p-3 shadow-[0_0_0_3px_rgba(255,255,255,0.78)] [clip-path:polygon(9%_0,100%_0,94%_100%,0_100%,0_26%)]"
              >
                <Image
                  src={
                    player.character
                      ? `/characters/${player.character}.png`
                      : "/characters/question.png"
                  }
                  alt={player.character ?? "未選択"}
                  width={56}
                  height={56}
                  className="rounded-sm"
                />

                <div>
                  <p className="font-bold">
                    {player.name}
                  </p>

                  <p className="text-sm text-green-700">
                    生存
                  </p>
                </div>
              </div>
            ))}
        </div>

        <div className="absolute bottom-0 left-0">
          <div className="bg-[#82e575] px-20 py-6 text-4xl font-bold text-white shadow-[0_0_0_5px_rgba(208,255,190,0.95)] [clip-path:polygon(12%_0,100%_0,94%_78%,82%_100%,0_96%,0_24%)]">
            チャット
          </div>
        </div>

        <div className="absolute bottom-0 right-0 flex w-[min(45rem,58vw)] gap-6">
          {isSpectator ? (
            <p className="flex-1 border-4 border-black bg-white px-6 py-4 text-3xl text-[#666]">
              閲覧者モードのため発言できません
            </p>
          ) : (
            <>
              <input
                type="text"
                value={message}
                disabled={isSending}
                placeholder="メッセージを入力..."
                className="min-w-0 flex-1 border-4 border-black bg-white px-6 py-4 text-3xl text-[#666] outline-none placeholder:text-[#777]"
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={async (event) => {
                  if (event.key === "Enter") {
                    await submitMessage();
                  }
                }}
              />

              <button
                type="button"
                onClick={submitMessage}
                disabled={isSending}
                className="border-4 border-black bg-white px-8 py-4 text-3xl text-[#666] transition hover:bg-gray-100 disabled:text-gray-300"
              >
                送信
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

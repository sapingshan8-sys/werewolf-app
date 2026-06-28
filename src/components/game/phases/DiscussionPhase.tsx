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
  const latestMessage =
    messages[messages.length - 1];
  const speakerId = latestMessage?.playerId;

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
    <div className="relative -mx-8 -my-8 min-h-screen overflow-x-auto overflow-y-hidden bg-[#d8eff8] px-8 py-8 text-[#2e2c2c]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(220,246,255,0.96)_0%,rgba(189,227,238,0.9)_45%,rgba(235,239,238,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.8)_0%,transparent_28%),radial-gradient(circle_at_76%_70%,rgba(113,190,199,0.22)_0%,transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_2px,transparent_2px,transparent_7px)]" />

      <div className="relative z-10 min-h-[calc(100vh-4rem)] min-w-[72rem]">
        <div className="absolute left-[-2rem] top-[-1.4rem] bg-white/88 px-16 py-6 pr-24 shadow-[0_0_0_3px_rgba(255,255,255,0.8),4px_4px_0_rgba(0,0,0,0.42)] [clip-path:polygon(0_0,100%_0,100%_70%,84%_100%,0_100%)]">
          <h2 className="text-4xl font-light tracking-[0.12em]">
            {day}日目
          </h2>
        </div>

        {canProceed && onProceed && (
          <button
            type="button"
            onClick={onProceed}
            className="absolute right-0 top-0 w-52 bg-[#8f8f8f]/90 px-7 py-4 text-3xl font-light leading-tight text-white shadow-[0_0_0_3px_rgba(255,255,255,0.76),5px_5px_0_rgba(0,0,0,0.35)] transition hover:bg-[#777] [clip-path:polygon(12%_0,100%_0,100%_70%,84%_100%,0_94%,0_26%)]"
          >
            次へ
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            setIsRolePanelOpen((current) => !current)
          }
          className="absolute right-0 top-28 w-56 bg-[#8f8f8f]/86 px-7 py-5 text-3xl font-light leading-tight text-white shadow-[0_0_0_3px_rgba(255,255,255,0.76),5px_5px_0_rgba(0,0,0,0.32)] transition hover:bg-[#777] [clip-path:polygon(12%_0,100%_0,100%_70%,84%_100%,0_94%,0_26%)]"
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
          className="absolute right-0 top-64 w-52 bg-[#8f8f8f]/78 px-7 py-5 text-3xl font-light leading-tight text-white shadow-[0_0_0_3px_rgba(255,255,255,0.72),5px_5px_0_rgba(0,0,0,0.32)] transition hover:bg-[#777] [clip-path:polygon(12%_0,100%_0,100%_70%,84%_100%,0_94%,0_26%)]"
        >
          投票
          <br />
          結果
        </button>

      {voteStage === "runoff" && (
        <div className="absolute left-6 top-28 max-w-xl bg-white/80 p-5 shadow-[0_0_0_3px_rgba(255,255,255,0.78),4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(4%_0,100%_0,96%_100%,0_100%,0_18%)]">
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

        {isRolePanelOpen && (
          <div className="absolute right-72 top-36 w-72 bg-white/88 p-5 shadow-[0_0_0_3px_rgba(255,255,255,0.78),5px_5px_0_rgba(0,0,0,0.3)]">
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
          <div className="absolute right-72 top-80 max-h-[24rem] w-[34rem] overflow-y-auto bg-white/92 p-5 shadow-[0_0_0_3px_rgba(255,255,255,0.78),5px_5px_0_rgba(0,0,0,0.3)]">
            <VoteHistory history={voteHistory} />
          </div>
        )}

        <div className="absolute left-6 right-72 top-28 grid grid-cols-4 gap-3 pr-8">
          {players
            .filter((player) => player.alive !== false)
            .map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-2 shadow-[0_0_0_3px_rgba(255,255,255,0.7)] [clip-path:polygon(9%_0,100%_0,94%_100%,0_100%,0_26%)] ${
                  player.id === speakerId
                    ? "bg-[#88df72]/82"
                    : "bg-white/62"
                }`}
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

        <div className="absolute bottom-[18.5rem] left-8">
          <div className="bg-[#6cca58]/85 px-8 py-4 text-3xl font-light tracking-[0.12em] text-white shadow-[0_0_0_3px_rgba(190,255,170,0.9),4px_4px_0_rgba(0,0,0,0.3)] [clip-path:polygon(12%_0,100%_0,94%_78%,82%_100%,0_96%,0_24%)]">
            チャット
          </div>
        </div>

        <div className="absolute bottom-0 left-4 right-4 h-80 border-l-4 border-t-4 border-white/85 bg-white/82 px-10 py-8 shadow-[0_0_0_3px_rgba(255,255,255,0.5)] [clip-path:polygon(3%_0,100%_0,100%_100%,0_100%,0_12%)]">
          <div className="h-44 overflow-y-auto pr-4">
            {messages.length === 0 ? (
              <p className="text-2xl leading-relaxed text-[#777]">
                まだメッセージはありません。
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((chatMessage) => (
                  <div
                    key={chatMessage.id}
                    className="grid grid-cols-[10rem_1fr] gap-4 text-2xl leading-relaxed text-[#3f3d3d]"
                  >
                    <p className="truncate font-bold text-[#2870a4]">
                      {chatMessage.playerName}
                    </p>

                    <p className="break-words">
                      {chatMessage.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 right-10 flex w-[min(48rem,54vw)] gap-5">
          {isSpectator ? (
            <p className="flex-1 border-4 border-black bg-white px-6 py-4 text-2xl text-[#666]">
              閲覧者モードのため発言できません
            </p>
          ) : (
            <>
              <input
                type="text"
                value={message}
                disabled={isSending}
                placeholder="メッセージを入力..."
                className="min-w-0 flex-1 border-4 border-black bg-white px-6 py-4 text-2xl text-[#666] outline-none placeholder:text-[#777]"
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
                className="border-4 border-black bg-white px-8 py-4 text-2xl text-[#666] transition hover:bg-gray-100 disabled:text-gray-300"
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

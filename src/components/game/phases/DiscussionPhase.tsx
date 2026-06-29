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
    <div className="relative min-h-screen overflow-x-auto overflow-y-hidden bg-[#d8eff8] px-8 py-8 text-[#2e2c2c]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(220,246,255,0.96)_0%,rgba(189,227,238,0.9)_45%,rgba(235,239,238,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.8)_0%,transparent_28%),radial-gradient(circle_at_76%_70%,rgba(113,190,199,0.22)_0%,transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_2px,transparent_2px,transparent_7px)]" />

      <div className="relative z-10 min-h-[calc(100vh-4rem)] min-w-[72rem]">
        <div className="absolute left-[-2rem] top-[-1.4rem] z-20 bg-white/88 px-16 py-6 pr-24 shadow-[0_0_0_4px_rgba(255,255,255,0.86),4px_4px_0_rgba(0,0,0,0.34)] [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)]">
          <h2 className="text-4xl font-light tracking-[0.12em]">
            {day}日目
          </h2>
        </div>

        {canProceed && onProceed && (
          <button
            type="button"
            onClick={onProceed}
            className="group absolute right-2 top-0 z-50 h-20 w-48 p-1 text-white transition hover:translate-x-[-2px]"
          >
            <span className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.26)] [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
            <span className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
            <span className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.13)_0px,rgba(255,255,255,0.13)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
            <span className="absolute left-6 top-6 h-7 w-12 border-2 border-white/90 text-sm leading-6 text-white/90">
              NEXT
            </span>
            <span className="relative z-10 block pl-14 pr-4 pt-4 text-2xl font-light leading-tight drop-shadow">
              次へ
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            setIsRolePanelOpen((current) => !current)
          }
          className="group absolute right-2 top-24 z-50 h-24 w-52 p-1 text-white transition hover:translate-x-[-2px]"
        >
          <span className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.26)] [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.13)_0px,rgba(255,255,255,0.13)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute left-6 top-14 h-7 w-12 border-2 border-white/90 text-sm leading-6 text-white/90">
            CO
          </span>
          <span className="relative z-10 block pl-16 pr-3 pt-4 text-2xl font-light leading-tight drop-shadow">
            役割を
            <br />
            明かす
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setIsVoteHistoryOpen((current) => !current)
          }
          className="group absolute right-2 top-52 z-50 h-24 w-52 p-1 text-white transition hover:translate-x-[-2px]"
        >
          <span className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.26)] [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.13)_0px,rgba(255,255,255,0.13)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(22%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute left-6 top-14 h-7 w-12 border-2 border-white/90 text-sm leading-6 text-white/90">
            DATA
          </span>
          <span className="relative z-10 block pl-16 pr-3 pt-4 text-2xl font-light leading-tight drop-shadow">
            投票
            <br />
            結果
          </span>
        </button>

        {voteStage === "runoff" && (
          <div className="absolute left-6 top-28 z-20 max-w-xl bg-white/82 p-5 shadow-[0_0_0_4px_rgba(255,255,255,0.82),4px_4px_0_rgba(0,0,0,0.2)] [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_28%)]">
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
          <div className="absolute right-60 top-24 z-40 max-h-72 w-80 overflow-y-auto border border-white/55 bg-[#626a73]/95 p-5 text-white shadow-[0_0_0_3px_rgba(255,255,255,0.5),0_18px_36px_rgba(37,55,66,0.24)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_44%),repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_7px)]" />

            <div className="relative z-10">
              <h3 className="mb-4 border-b border-white/35 pb-3 text-xl font-light tracking-[0.16em]">
                CO
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {claimableRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => claimRole(role)}
                    disabled={isSpectator || isSending}
                    className="border border-white/45 bg-white/14 px-3 py-2 font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.16)] transition hover:bg-white/24 disabled:text-white/35"
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>

              {claimableRoles.length === 0 && (
                <p className="text-white/82">
                  COできる役職を読み込み中です。
                </p>
              )}
            </div>
          </div>
        )}

        {isVoteHistoryOpen && (
          <div className="absolute right-60 top-52 z-40 max-h-64 w-[32rem] overflow-y-auto border border-white/55 bg-[#626a73]/95 p-5 text-white shadow-[0_0_0_3px_rgba(255,255,255,0.5),0_18px_36px_rgba(37,55,66,0.24)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_44%),repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_7px)]" />

            <div className="relative z-10 text-white [&_div]:border-white/35 [&_h2]:mb-4 [&_h2]:text-white [&_h3]:text-white [&_p]:text-white/85 [&_table]:text-white [&_td]:border-white/30 [&_td]:text-white/92 [&_th]:border-white/30 [&_th]:bg-white/14 [&_th]:text-white [&_thead_tr]:bg-transparent">
              <VoteHistory history={voteHistory} />
            </div>
          </div>
        )}

        <div className="absolute left-6 right-72 top-28 z-10 grid grid-cols-4 gap-3 pr-8">
          {players
            .filter((player) => player.alive !== false)
            .map((player) => (
              <div
                key={player.id}
                className={`flex h-20 items-center gap-3 overflow-hidden p-2 shadow-[0_0_0_4px_rgba(255,255,255,0.78)] [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_36%)] ${
                  player.id === speakerId
                    ? "bg-[#b7d6ee]/88"
                    : "bg-white/76"
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
                  className="rounded-sm object-cover"
                />

                <div>
                  <p className="font-bold">
                    {player.name}
                  </p>

                  <p className="text-sm font-semibold text-green-700">
                    生存
                  </p>
                </div>
              </div>
            ))}
        </div>

        <div className="absolute bottom-[15.2rem] left-8 z-30">
          <div className="bg-[#6cca58]/88 px-8 py-2 text-2xl font-light tracking-[0.12em] text-white shadow-[0_0_0_4px_rgba(190,255,170,0.9),4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_36%)]">
            チャット
          </div>
        </div>

        <div className="absolute bottom-0 left-4 right-4 z-20 h-60 bg-white/84 px-8 py-7 shadow-[0_0_0_4px_rgba(255,255,255,0.72),5px_5px_0_rgba(0,0,0,0.18)] [clip-path:polygon(3%_0,100%_0,100%_100%,0_100%,0_12%)]">
          <div className="h-32 overflow-y-auto pr-4">
            {messages.length === 0 ? (
              <p className="text-xl leading-relaxed text-[#777]">
                まだメッセージはありません。
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((chatMessage) => (
                  <div
                    key={chatMessage.id}
                    className="grid grid-cols-[8rem_1fr] gap-4 text-xl leading-relaxed text-[#3f3d3d]"
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

        <div className="absolute bottom-4 right-10 z-30 flex w-[min(38rem,48vw)] gap-3">
          {isSpectator ? (
            <p className="flex-1 border-[3px] border-black bg-white px-4 py-3 text-xl text-[#666]">
              閲覧者モードのため発言できません
            </p>
          ) : (
            <>
              <input
                type="text"
                value={message}
                disabled={isSending}
                placeholder="メッセージを入力..."
                className="min-w-0 flex-1 border-[3px] border-black bg-white px-4 py-3 text-xl text-[#666] outline-none placeholder:text-[#777]"
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
                className="border-[3px] border-black bg-white px-6 py-3 text-xl text-[#666] transition hover:bg-gray-100 disabled:text-gray-300"
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

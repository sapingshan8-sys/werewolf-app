"use client";

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
import PlayerGrid from "../common/PlayerGrid";
import type { Player } from "@/types/player";
import ChatInput from "../evening/ChatInput";
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
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
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
  };

  return (
    <div>

      <h2 className="text-3xl font-bold mb-4">
        議論フェーズ
      </h2>

      <p className="mb-6 text-gray-700">
        怪しい人物について話し合いましょう。
      </p>

      {voteStage === "runoff" && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5">
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

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="border rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-4">
            昼チャット
          </h3>

          <div className="border rounded-lg bg-gray-50 h-96 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-gray-500">
                まだメッセージはありません。
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="mb-4"
                >
                  <p className="font-bold text-blue-600">
                    {message.playerName}
                  </p>

                  <p className="ml-3 break-words">
                    {message.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {isSpectator ? (
            <p className="mt-4 text-gray-600">
              閲覧者モードのため発言できません。
            </p>
          ) : (
            <ChatInput
              onSend={sendMessage}
              disabled={isSending}
            />
          )}
        </div>

        <div className="border rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-4">
            CO
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {claimableRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => claimRole(role)}
                disabled={isSpectator || isSending}
                className="rounded-lg border px-3 py-2 font-semibold hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400"
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
      </div>

      <div className="mb-8">
        <button
          type="button"
          onClick={() =>
            setIsVoteHistoryOpen((current) => !current)
          }
          className="rounded-lg border px-4 py-2 font-semibold hover:bg-gray-50"
        >
          {isVoteHistoryOpen
            ? "投票履歴を閉じる"
            : "前日以前の投票履歴を見る"}
        </button>

        {isVoteHistoryOpen && (
          <VoteHistory history={voteHistory} />
        )}
      </div>

      <PlayerGrid players={players} />

    </div>
  );
}

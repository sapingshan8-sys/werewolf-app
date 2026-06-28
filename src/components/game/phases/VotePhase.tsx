"use client";

import Image from "next/image";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  players: PlayerWithId[];
  myPlayerId: string;
  currentVoteTargetId?: string;
  voteStage?: string;
  runoffCandidateIds?: string[];
  errorMessage?: string;
  isSubmitting: boolean;
  submittedCount: number;
  votePlayer: (targetId: string) => Promise<void>;
  voteExileDecision: (
    decision: "exileAll" | "noExile"
  ) => Promise<void>;
};

export default function VotePhase({
  players,
  myPlayerId,
  currentVoteTargetId,
  voteStage = "normal",
  runoffCandidateIds = [],
  errorMessage,
  isSubmitting,
  submittedCount,
  votePlayer,
  voteExileDecision,
}: Props) {
  const alivePlayers = players.filter(
    (player) => player.alive !== false
  );
  const votedTarget = players.find(
    (player) => player.id === currentVoteTargetId
  );
  const runoffCandidates = alivePlayers.filter(
    (player) =>
      runoffCandidateIds.includes(player.id)
  );
  const isExileDecision =
    voteStage === "exileDecision";
  const decisionLabel =
    currentVoteTargetId === "exileAll"
      ? "全員コールドスリープする"
      : currentVoteTargetId === "noExile"
        ? "誰もコールドスリープしない"
        : "";

  return (
    <div>

      <h2 className="text-3xl font-bold mb-4">
        {voteStage === "runoff"
          ? "再投票フェーズ"
          : isExileDecision
            ? "コールドスリープ可否投票"
            : "投票フェーズ"}
      </h2>

      <p className="mb-6 text-gray-700">
        {voteStage === "runoff"
          ? "前回最多票だった人物の中から選んでください。"
          : isExileDecision
            ? "最多票だった人物を全員コールドスリープするか決めてください。"
            : "コールドスリープする人物を選んでください。"}
      </p>

      <div className="mb-8 rounded-xl border bg-red-50 p-4">
        <p className="font-semibold">
          投票
        </p>

        <p className="mt-2 text-gray-700">
          {voteStage === "runoff"
            ? "候補者以外には投票できません。自分には投票できません。"
            : isExileDecision
              ? "同票の場合は、誰もコールドスリープしません。"
              : "生存者を1人選択してください。自分には投票できません。"}
        </p>

        <p className="mt-3 text-sm text-gray-600">
          投票済み: {submittedCount} / {alivePlayers.length}
        </p>

        {(votedTarget || decisionLabel) && (
          <p className="mt-3 font-semibold text-red-700">
            あなたは{" "}
            {votedTarget?.name ?? decisionLabel} に投票しました。
            全員の投票を待っています。
          </p>
        )}

        {errorMessage && (
          <p className="mt-3 font-semibold text-red-700">
            {errorMessage}
          </p>
        )}
      </div>

      {isExileDecision && (
        <>
          <div className="mb-6 rounded-xl border p-4">
            <h3 className="mb-3 text-xl font-bold">
              対象者
            </h3>

            <div className="flex flex-wrap gap-3">
              {runoffCandidates.map((player) => (
                <span
                  key={player.id}
                  className="rounded-full bg-red-100 px-4 py-2 font-semibold text-red-700"
                >
                  {player.name}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              disabled={
                isSubmitting ||
                Boolean(currentVoteTargetId)
              }
              onClick={() =>
                voteExileDecision("exileAll")
              }
              className={`rounded-xl border p-6 text-xl font-bold transition ${
                currentVoteTargetId === "exileAll"
                  ? "ring-4 ring-red-300"
                  : "hover:bg-red-50"
              } disabled:bg-gray-200 disabled:text-gray-500`}
            >
              全員コールドスリープする
            </button>

            <button
              disabled={
                isSubmitting ||
                Boolean(currentVoteTargetId)
              }
              onClick={() =>
                voteExileDecision("noExile")
              }
              className={`rounded-xl border p-6 text-xl font-bold transition ${
                currentVoteTargetId === "noExile"
                  ? "ring-4 ring-blue-300"
                  : "hover:bg-blue-50"
              } disabled:bg-gray-200 disabled:text-gray-500`}
            >
              誰もコールドスリープしない
            </button>
          </div>
        </>
      )}

      {!isExileDecision && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

        {alivePlayers.map((player) => {

            const isMe =
              player.id === myPlayerId;
            const isRunoffCandidate =
              voteStage !== "runoff" ||
              runoffCandidateIds.includes(player.id);
            const voted =
              player.id === currentVoteTargetId;
            const disabled =
              isMe ||
              !isRunoffCandidate ||
              isSubmitting ||
              Boolean(currentVoteTargetId);

            return (

              <button
                key={player.id}
                disabled={disabled}
                onClick={() =>
                  votePlayer(player.id)
                }
                className={`border rounded-xl p-4 transition
                  ${
                    disabled
                      ? "bg-gray-200 cursor-not-allowed"
                      : "hover:bg-red-100"
                  }
                  ${voted ? "ring-4 ring-red-300" : ""}
                `}
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

                {isMe && (
                  <p className="mt-2 text-sm text-gray-500">
                    あなた
                  </p>
                )}

                {!isRunoffCandidate && (
                  <p className="mt-2 text-sm text-gray-500">
                    候補外
                  </p>
                )}

                {voted && (
                  <p className="mt-2 text-sm font-semibold text-red-700">
                    投票済み
                  </p>
                )}

              </button>

            );
          })}

        </div>
      )}

    </div>
  );
}

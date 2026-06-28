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
  const title =
    voteStage === "runoff"
      ? "再投票して下さい"
      : isExileDecision
        ? "決定して下さい"
        : "投票して下さい";
  const englishTitle =
    isExileDecision ? "DECISION" : "VOTE";

  return (
    <div className="relative -mx-8 -my-8 min-h-screen bg-[linear-gradient(180deg,#eeeeee_0%,#d9dcde_100%)] px-8 py-8 text-[#3e3b3b]">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.16)_0px,rgba(255,255,255,0.16)_2px,transparent_2px,transparent_7px)]" />

      <div className="relative z-10">
        <div className="relative mb-8 inline-block bg-[#e6aa08]/95 px-8 py-3 pr-24 shadow-[0_0_0_4px_rgba(255,255,255,0.85)] [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)]">
          <h2 className="text-4xl font-light tracking-[0.08em]">
            {title}
          </h2>

          <span className="absolute right-8 top-1 text-5xl font-semibold italic text-white/40 [font-family:Georgia,Times_New_Roman,serif]">
            {englishTitle}
          </span>
        </div>

      <p className="mb-6 max-w-3xl text-lg text-[#565252]">
        {voteStage === "runoff"
          ? "前回最多票だった人物の中から選んでください。"
          : isExileDecision
            ? "最多票だった人物を全員コールドスリープするか決めてください。"
            : "コールドスリープする人物を選んでください。"}
      </p>

      <div className="mb-8 max-w-4xl border-l-4 border-white/80 bg-white/50 p-4 shadow-[0_0_0_2px_rgba(255,255,255,0.6)]">
        <p className="text-[#565252]">
          {voteStage === "runoff"
            ? "候補者以外には投票できません。自分には投票できません。"
            : isExileDecision
              ? "同票の場合は、誰もコールドスリープしません。"
              : "生存者を1人選択してください。自分には投票できません。"}
        </p>

        <p className="mt-3 text-sm text-[#6f5d4c]">
          投票済み: {submittedCount} / {alivePlayers.length}
        </p>

        {(votedTarget || decisionLabel) && (
          <p className="mt-3 font-semibold text-[#1b78b7]">
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
          <div className="mb-6 max-w-4xl border-l-4 border-white/80 bg-white/50 p-4">
            <h3 className="mb-3 text-xl font-light tracking-[0.12em]">
              対象者
            </h3>

            <div className="flex flex-wrap gap-3">
              {runoffCandidates.map((player) => (
                <span
                  key={player.id}
                  className="bg-[#f2a8bd]/80 px-4 py-2 font-semibold text-[#5b3940]"
                >
                  {player.name}
                </span>
              ))}
            </div>
          </div>

          <div className="grid max-w-4xl gap-5 md:grid-cols-2">
            <button
              disabled={
                isSubmitting ||
                Boolean(currentVoteTargetId)
              }
              onClick={() =>
                voteExileDecision("exileAll")
              }
              className={`relative h-28 overflow-hidden text-2xl transition [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_36%)] ${
                currentVoteTargetId === "exileAll"
                  ? "bg-[#f2a8bd] shadow-[0_0_0_4px_rgba(210,225,0,0.95),0_0_0_8px_rgba(255,255,255,0.85)]"
                  : "bg-white/82 shadow-[0_0_0_4px_rgba(255,255,255,0.86)] hover:bg-[#f2c3cf]"
              } disabled:opacity-60`}
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
              className={`relative h-28 overflow-hidden text-2xl transition [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_36%)] ${
                currentVoteTargetId === "noExile"
                  ? "bg-[#b7d6ee] shadow-[0_0_0_4px_rgba(210,225,0,0.95),0_0_0_8px_rgba(255,255,255,0.85)]"
                  : "bg-white/82 shadow-[0_0_0_4px_rgba(255,255,255,0.86)] hover:bg-[#dcebf6]"
              } disabled:opacity-60`}
            >
              誰もコールドスリープしない
            </button>
          </div>
        </>
      )}

      {!isExileDecision && (
        <div className="grid gap-x-10 gap-y-5 lg:grid-cols-3">

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
                className={`group relative h-24 overflow-hidden text-left transition [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_36%)]
                  ${
                    voted
                      ? "bg-[#b7d6ee] shadow-[0_0_0_4px_rgba(210,225,0,0.95),0_0_0_8px_rgba(255,255,255,0.85)]"
                      : disabled
                        ? "bg-white/45 opacity-55 shadow-[0_0_0_4px_rgba(255,255,255,0.65)]"
                        : "bg-white/82 shadow-[0_0_0_4px_rgba(255,255,255,0.86)] hover:bg-[#dcebf6]"
                  }
                `}
              >
                <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden opacity-90">
                  <Image
                    src={
                      player.character
                        ? `/characters/${player.character}.png`
                        : "/characters/question.png"
                    }
                    alt={player.character ?? ""}
                    fill
                    sizes="260px"
                    className="object-cover object-center transition group-hover:scale-105"
                  />
                </div>

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.9)_46%,rgba(255,255,255,0.08)_100%)]" />

                <div className="absolute inset-0 border-2 border-white/80 [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_36%)]" />

                <p className="relative z-10 ml-12 mt-5 text-3xl font-light tracking-[0.08em]">
                  {player.name}
                </p>

                {isMe && (
                  <p className="relative z-10 ml-12 mt-1 text-sm text-[#6f5d4c]">
                    あなた
                  </p>
                )}

                {!isRunoffCandidate && (
                  <p className="relative z-10 ml-12 mt-1 text-sm text-[#6f5d4c]">
                    候補外
                  </p>
                )}

                {voted && (
                  <p className="relative z-10 ml-12 mt-1 text-sm font-semibold tracking-[0.18em] text-[#1b78b7]">
                    投票済み
                  </p>
                )}

              </button>

            );
          })}

        </div>
      )}

      </div>
    </div>
  );
}

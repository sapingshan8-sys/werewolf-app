"use client";

const phaseNames: Record<string, string> = {
  roleReveal: "役職確認",
  discussion: "議論",
  vote: "投票",
  sleep: "コールドスリープ",
  evening: "自由時間",
  night: "夜",
  result: "ゲーム終了",
};

type Props = {
  phase: string;
  myPlayerId: string;
  hostId: string;
  onNextPhase: () => void;
};

export default function PhaseHeader({
  phase,
  myPlayerId,
  hostId,
  onNextPhase,
}: Props) {
  return (
    <>
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
            onClick={onNextPhase}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            次のフェーズへ
          </button>
        </div>
      )}
    </>
  );
}

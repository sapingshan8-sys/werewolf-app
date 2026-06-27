"use client";

type Props = {
  winner: string;
};

const winnerInfo: Record<
  string,
  {
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
  }
> = {
  crew: {
    title: "乗員陣営 勝利",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-400",
    description:
      "すべてのグノーシアをコールドスリープしました。",
  },

  gnosia: {
    title: "グノーシア陣営 勝利",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-400",
    description:
      "グノーシアが乗員と同数以上になりました。",
  },

  bug: {
    title: "バグ 勝利",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-400",
    description:
      "最後まで生き残りました。",
  },

  acFollower: {
    title: "AC主義者 勝利",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-400",
    description:
      "グノーシア陣営の勝利に貢献しました。",
  },
};

export default function WinnerPanel({
  winner,
}: Props) {
  const info =
    winnerInfo[winner] ?? {
      title: "ゲーム終了",
      color: "text-gray-700",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-400",
      description: "",
    };

  return (
    <div
      className={`
        ${info.bgColor}
        ${info.borderColor}
        border-2
        rounded-xl
        p-8
        text-center
        mb-10
      `}
    >
      <h2
        className={`text-4xl font-bold ${info.color}`}
      >
        {info.title}
      </h2>

      <p className="mt-6 text-lg text-gray-700">
        {info.description}
      </p>
    </div>
  );
}
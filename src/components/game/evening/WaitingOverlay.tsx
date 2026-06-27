"use client";

type Props = {
  title?: string;
  message?: string;
};

export default function WaitingOverlay({
  title = "待機中",
  message = "他のプレイヤーの操作が終了するまでお待ちください。",
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

      <div className="bg-white rounded-2xl shadow-xl p-10 w-[420px] text-center">

        <div className="text-6xl mb-6">
          ⏳
        </div>

        <h2 className="text-3xl font-bold mb-4">
          {title}
        </h2>

        <p className="text-gray-600 leading-relaxed">
          {message}
        </p>

        {/* ローディングアニメーション */}
        <div className="flex justify-center gap-2 mt-8">

          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" />

          <div
            className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"
            style={{
              animationDelay: "0.2s",
            }}
          />

          <div
            className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"
            style={{
              animationDelay: "0.4s",
            }}
          />

        </div>

      </div>

    </div>
  );
}
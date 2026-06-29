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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#244c5c]/42 backdrop-blur-sm">

      <div className="relative w-[420px] overflow-hidden border border-white/70 bg-white/72 text-center text-[#2e2c2c] shadow-[0_0_0_3px_rgba(255,255,255,0.55),0_24px_54px_rgba(24,73,88,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(201,232,241,0.3)_54%,rgba(255,255,255,0.44)),repeating-linear-gradient(0deg,rgba(113,158,170,0.09)_0px,rgba(113,158,170,0.09)_1px,transparent_1px,transparent_8px)]" />

        <div className="relative z-10 p-10">
        <h2 className="mb-4 text-3xl font-light tracking-[0.14em] text-[#2f6d90]">
          {title}
        </h2>

        <p className="leading-relaxed text-[#5f747b]">
          {message}
        </p>

        {/* ローディングアニメーション */}
        <div className="flex justify-center gap-2 mt-8">

          <div className="h-3 w-3 animate-bounce rounded-full bg-[#5daec0]" />

          <div
            className="h-3 w-3 animate-bounce rounded-full bg-[#5daec0]"
            style={{
              animationDelay: "0.2s",
            }}
          />

          <div
            className="h-3 w-3 animate-bounce rounded-full bg-[#5daec0]"
            style={{
              animationDelay: "0.4s",
            }}
          />

        </div>

        </div>
      </div>

    </div>
  );
}

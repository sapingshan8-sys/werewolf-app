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

      <div className="relative w-[420px] p-1 text-center text-white">
        <div className="absolute inset-0 bg-white/88 shadow-[5px_5px_0_rgba(0,0,0,0.28)] [clip-path:polygon(10%_0,100%_0,94%_100%,0_100%,0_20%)]" />
        <div className="absolute inset-[5px] bg-[#727681]/88 [clip-path:polygon(10%_0,100%_0,94%_100%,0_100%,0_20%)]" />
        <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(10%_0,100%_0,94%_100%,0_100%,0_20%)]" />

        <div className="relative z-10 p-10">
        <h2 className="mb-4 text-3xl font-light tracking-[0.14em]">
          {title}
        </h2>

        <p className="leading-relaxed text-white/84">
          {message}
        </p>

        {/* ローディングアニメーション */}
        <div className="flex justify-center gap-2 mt-8">

          <div className="h-3 w-3 animate-bounce rounded-full bg-white/88" />

          <div
            className="h-3 w-3 animate-bounce rounded-full bg-white/88"
            style={{
              animationDelay: "0.2s",
            }}
          />

          <div
            className="h-3 w-3 animate-bounce rounded-full bg-white/88"
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

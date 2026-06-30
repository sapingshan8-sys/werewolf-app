"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  // 秒数
  initialSeconds: number;

  // 共有タイマーの開始時刻
  startedAt?: number | null;

  // 時間切れ
  onFinish?: () => void;

  // タイマーを動かすか
  isRunning?: boolean;

  variant?: "default" | "discussion";
};

export default function Timer({
  initialSeconds,
  startedAt,
  onFinish,
  isRunning = true,
  variant = "default",
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const getRemainingSeconds = useCallback(() => {
    if (!startedAt) {
      return initialSeconds;
    }

    const elapsedSeconds = Math.floor(
      (now - startedAt) / 1000
    );

    return Math.max(0, initialSeconds - elapsedSeconds);
  }, [initialSeconds, now, startedAt]);

  const hasFinishedRef = useRef(false);
  const seconds = getRemainingSeconds();

  useEffect(() => {
    hasFinishedRef.current = false;
  }, [initialSeconds, startedAt]);

  useEffect(() => {
    if (!isRunning) return;

    if (seconds <= 0) {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        onFinish?.();
      }
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, isRunning, onFinish]);

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  if (variant === "discussion") {
    return (
      <div className="flex justify-center">
        <div className="relative min-w-36 overflow-hidden border border-white/65 bg-[#2f8ec2]/34 px-5 py-2 text-center text-white shadow-[0_0_0_2px_rgba(255,255,255,0.32),0_10px_28px_rgba(54,132,164,0.18)] backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.32),transparent_55%),repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_6px)]" />

          <div className="relative z-10">
            <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-white/72">
              TIME
            </p>

            <p className="text-2xl font-light tracking-[0.16em] drop-shadow">
              {String(minutes).padStart(2, "0")}:
              {String(remainSeconds).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="relative min-w-52 p-1 text-white">
        <div className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(16%_0,100%_0,92%_100%,0_100%,0_26%)]" />
        <div className="absolute inset-[5px] bg-[#727681]/82 [clip-path:polygon(16%_0,100%_0,92%_100%,0_100%,0_26%)]" />
        <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(16%_0,100%_0,92%_100%,0_100%,0_26%)]" />

        <div className="relative z-10 px-8 py-4 text-center">
        <p className="text-sm tracking-[0.24em] text-white/72">
          残り時間
        </p>

        <p className="text-4xl font-light tracking-widest">
          {String(minutes).padStart(2, "0")}:
          {String(remainSeconds).padStart(2, "0")}
        </p>
        </div>

      </div>
    </div>
  );
}

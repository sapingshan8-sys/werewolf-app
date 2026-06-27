"use client";

import { useEffect, useState } from "react";

type Props = {
  // 秒数
  initialSeconds: number;

  // 時間切れ
  onFinish?: () => void;

  // タイマーを動かすか
  isRunning?: boolean;
};

export default function Timer({
  initialSeconds,
  onFinish,
  isRunning = true,
}: Props) {
  const [timer, setTimer] = useState({
    initialSeconds,
    seconds: initialSeconds,
  });

  if (timer.initialSeconds !== initialSeconds) {
    setTimer({
      initialSeconds,
      seconds: initialSeconds,
    });
  }

  const seconds = timer.seconds;

  useEffect(() => {
    if (!isRunning) return;

    if (seconds <= 0) {
      onFinish?.();
      return;
    }

    const timer = setInterval(() => {
      setTimer((prev) => ({
        ...prev,
        seconds: prev.seconds - 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, isRunning, onFinish]);

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  return (
    <div className="flex justify-center mb-6">
      <div className="bg-gray-900 text-white rounded-xl px-8 py-4 shadow-lg">

        <p className="text-sm text-gray-300">
          残り時間
        </p>

        <p className="text-4xl font-bold tracking-widest">
          {String(minutes).padStart(2, "0")}:
          {String(remainSeconds).padStart(2, "0")}
        </p>

      </div>
    </div>
  );
}

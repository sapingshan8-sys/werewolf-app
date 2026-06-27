"use client";

export default function SleepPhase() {
  return (
    <div className="text-center py-16">

      <h2 className="text-4xl font-bold mb-6">
        コールドスリープ
      </h2>

      <div className="max-w-xl mx-auto rounded-xl border bg-blue-50 p-6">

        <p className="text-lg font-semibold">
          投票結果を集計しています…
        </p>

        <p className="mt-4 text-gray-700">
          最も多く投票された人物がコールドスリープされます。
        </p>

      </div>

      <div className="mt-10 text-gray-500">
        ホストが次のフェーズへ進めるまでお待ちください。
      </div>

    </div>
  );
}
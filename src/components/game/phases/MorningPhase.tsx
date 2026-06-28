"use client";

import Image from "next/image";

import Timer from "../common/Timer";

type EngineerResult = {
  targetName: string;
  isGnosia: boolean;
};

type DoctorResult = {
  targetName: string;
  isHuman: boolean;
};

type Props = {
  attackedPlayer?: {
    name: string;
    character?: string;
  };

  protectedSuccess?: boolean;

  bugKilled?: boolean;

  engineerResult?: EngineerResult;

  doctorResult?: DoctorResult;

  onFinish?: () => void;

  canProceed?: boolean;
};

export default function MorningPhase({
  attackedPlayer,
  protectedSuccess = false,
  bugKilled = false,
  engineerResult,
  doctorResult,
  onFinish,
  canProceed = false,
}: Props) {
  const finishMorning = () => {
    onFinish?.();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-4xl font-bold text-center mb-8">
        朝になりました
      </h1>

      <Timer
        initialSeconds={30}
        onFinish={finishMorning}
      />

      {/* 襲撃結果 */}

      <div className="border rounded-xl p-6 mt-8">

        <h2 className="text-2xl font-bold mb-4">
          夜の出来事
        </h2>

        {protectedSuccess ? (
          <p className="text-green-600 text-lg">
            守護天使が襲撃を防ぎました。
          </p>
        ) : attackedPlayer ? (
          <div className="flex items-center gap-4">

            <Image
              src={
                attackedPlayer.character
                  ? `/characters/${attackedPlayer.character}.png`
                  : "/characters/question.png"
              }
              alt={attackedPlayer.name}
              width={80}
              height={80}
              className="rounded-lg"
            />

            <div>

              <p className="text-lg">
                <strong>
                  {attackedPlayer.name}
                </strong>
                が消滅しました。
              </p>

            </div>

          </div>
        ) : (
          <p>
            昨夜は誰も消滅しませんでした。
          </p>
        )}

      </div>

      {/* Bug */}

      {bugKilled && (

        <div className="border rounded-xl p-6 mt-6 bg-red-50">

          <h2 className="text-xl font-bold mb-2">
            バグ消滅
          </h2>

          <p>
            バグが消滅しました。
          </p>

        </div>

      )}

      {/* Engineer */}

      {engineerResult && (

        <div className="border rounded-xl p-6 mt-6">

          <h2 className="text-xl font-bold mb-3">
            エンジニア結果
          </h2>

          <p>

            {engineerResult.targetName}

            は

            <strong className="ml-2">

              {engineerResult.isGnosia
                ? "グノーシア"
                : "人間"}

            </strong>

            でした。

          </p>

        </div>

      )}

      {/* Doctor */}

      {doctorResult && (

        <div className="border rounded-xl p-6 mt-6">

          <h2 className="text-xl font-bold mb-3">
            ドクター結果
          </h2>

          <p>

            {doctorResult.targetName}

            は

            <strong className="ml-2">

              {doctorResult.isHuman
                ? "人間"
                : "グノーシア"}

            </strong>

            でした。

          </p>

        </div>

      )}

      {canProceed ? (
        <div className="flex justify-center mt-10">

          <button
            onClick={finishMorning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl"
          >
            議論へ進む
          </button>

        </div>
      ) : (
        <p className="mt-10 text-center text-gray-600">
          ホストが議論フェーズへ進めるまでお待ちください。
        </p>
      )}

    </div>
  );
}

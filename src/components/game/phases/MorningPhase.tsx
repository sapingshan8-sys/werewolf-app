"use client";

import Image from "next/image";

type EngineerResult = {
  targetName: string;
  targetCharacter?: string;
  isGnosia: boolean;
};

type DoctorResult = {
  targetName: string;
  targetCharacter?: string;
  isHuman: boolean;
};

type Props = {
  eliminatedPlayers?: {
    name: string;
    character?: string;
  }[];

  protectedSuccess?: boolean;

  engineerResult?: EngineerResult;

  doctorResult?: DoctorResult;

  onFinish?: () => void;

  canProceed?: boolean;
};

export default function MorningPhase({
  eliminatedPlayers = [],
  engineerResult,
  doctorResult,
  onFinish,
  canProceed = false,
}: Props) {
  const finishMorning = () => {
    onFinish?.();
  };
  const eliminationLine =
    eliminatedPlayers.length > 0
      ? `昨夜、${eliminatedPlayers
          .map((player) => player.name)
          .join("、")}が消滅しました`
      : "昨夜は、誰も襲われませんでした";
  const resultLines = [
    eliminationLine,
    engineerResult
      ? `調査の結果、${engineerResult.targetName}は${
          engineerResult.isGnosia
            ? "グノーシア"
            : "人間"
        }でした`
      : "",
    doctorResult
      ? `脳解析の結果、${doctorResult.targetName}は${
          doctorResult.isHuman ? "人間" : "グノーシア"
        }でした`
      : "",
  ].filter(Boolean);
  const focusCharacter =
    eliminatedPlayers[0]?.character ??
    doctorResult?.targetCharacter ??
    engineerResult?.targetCharacter;
  const focusName =
    eliminatedPlayers[0]?.name ??
    doctorResult?.targetName ??
    engineerResult?.targetName ??
    "結果";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-8 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_42%,rgba(43,86,112,0.42)_0%,rgba(3,8,15,0.56)_30%,rgba(0,0,0,0.98)_68%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,1)_0%,rgba(0,0,0,0.94)_42%,rgba(0,0,0,0.34)_72%,rgba(0,0,0,0.7)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.035)_0px,rgba(255,255,255,0.035)_2px,transparent_2px,transparent_7px)]" />

      {focusCharacter && (
        <div className="absolute bottom-0 right-[-3rem] top-0 w-[46rem] opacity-55">
          <Image
            src={`/characters/${focusCharacter}.png`}
            alt={focusName}
            fill
            priority
            sizes="760px"
            className="object-cover object-center saturate-[0.85]"
          />
        </div>
      )}

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section className="relative w-[min(78rem,78vw)] p-1">
          <div className="absolute inset-0 bg-white/82 shadow-[8px_8px_0_rgba(255,255,255,0.16)] [clip-path:polygon(5%_0,100%_0,100%_78%,91%_100%,0_100%,0_15%)]" />
          <div className="absolute inset-[5px] bg-[#656875]/72 [clip-path:polygon(5%_0,100%_0,100%_78%,91%_100%,0_100%,0_15%)]" />
          <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(5%_0,100%_0,100%_78%,91%_100%,0_100%,0_15%)]" />

          <div className="relative z-10 flex min-h-72 flex-col items-center justify-center gap-5 px-16 py-12">
            {resultLines.map((line) => (
              <p
                key={line}
                className="text-center text-4xl font-light leading-relaxed tracking-[0.12em] text-white drop-shadow"
              >
                {line}
              </p>
            ))}
          </div>

          {canProceed ? (
            <div className="absolute bottom-[-5rem] right-4 z-20">
              <button
                onClick={finishMorning}
                className="relative h-28 w-56 p-1 text-white transition hover:translate-x-[-2px]"
              >
                <span className="absolute inset-0 bg-white/86 shadow-[5px_5px_0_rgba(255,255,255,0.14)] [clip-path:polygon(18%_0,100%_0,100%_70%,82%_100%,0_100%,0_34%)]" />
                <span className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(18%_0,100%_0,100%_70%,82%_100%,0_100%,0_34%)]" />
                <span className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.13)_0px,rgba(255,255,255,0.13)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(18%_0,100%_0,100%_70%,82%_100%,0_100%,0_34%)]" />
                <span className="absolute bottom-5 left-5 h-8 w-20 border-2 border-white/90 text-base leading-7 text-white/90">
                  NEXT
                </span>
                <span className="relative z-10 block pl-16 pt-6 text-4xl font-light tracking-[0.08em]">
                  次へ
                </span>
              </button>
            </div>
          ) : (
            <p className="absolute bottom-[-4rem] right-4 text-sm tracking-[0.12em] text-white/72">
              ホストが議論フェーズへ進めるまでお待ちください。
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

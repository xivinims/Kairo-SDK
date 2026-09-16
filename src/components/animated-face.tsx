import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedFace({
  className,
  size = "md",
  lookAngle = "right",
}: {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  lookAngle?: "animate" | "right" | "front";
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (lookAngle !== "animate") return;

    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    let t4: ReturnType<typeof setTimeout>;

    const animarOlhar = () => {
      setOffset(0);
      t1 = setTimeout(() => {
        setOffset(12);
      }, 1800);
      t2 = setTimeout(() => {
        setOffset(0);
      }, 3200);
      t3 = setTimeout(() => {
        setOffset(-12);
      }, 4800);
      t4 = setTimeout(() => {
        setOffset(0);
      }, 6200);
    };

    animarOlhar();
    const interval = setInterval(animarOlhar, 6200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(interval);
    };
  }, [lookAngle]);

  if (size === "xs") {
    // Ultra-compact mascot icon for buttons and chat history list
    return (
      <div
        role="img"
        aria-label="Mascote Kairo"
        className={cn(
          "relative size-5 shrink-0 rounded-full bg-[#242424] shadow-sm flex items-center justify-center overflow-hidden inline-flex",
          className,
        )}
      >
        {/* Olhos alinhados sem rotação de graus */}
        <div
          aria-hidden="true"
          className="absolute left-[7px] top-[3.5px] h-[7px] w-[3.5px] rounded-[2px] bg-[#c5c5c5]"
        />
        <div
          aria-hidden="true"
          className="absolute left-[13px] top-[3.5px] h-[7px] w-[3.5px] rounded-[2px] bg-[#c5c5c5]"
        />
      </div>
    );
  }

  if (size === "sm") {
    // Small mascot for tags, pills or bot indicators
    return (
      <div
        role="img"
        aria-label="Mascote Kairo"
        className={cn(
          "relative size-7 shrink-0 rounded-full bg-[#242424] shadow-sm flex items-center justify-center overflow-hidden inline-flex",
          className,
        )}
      >
        {/* Olhos alinhados sem rotação de graus */}
        <div
          aria-hidden="true"
          className="absolute left-[10px] top-[5px] h-[10px] w-[4.5px] rounded-[3px] bg-[#c5c5c5]"
        />
        <div
          aria-hidden="true"
          className="absolute left-[18px] top-[5px] h-[10px] w-[4.5px] rounded-[3px] bg-[#c5c5c5]"
        />
      </div>
    );
  }

  // Medium (Subtle home screen mascot)
  return (
    <div
      role="img"
      aria-label="Mascote Kairo pequeno"
      className={cn(
        "relative size-[52px] shrink-0 rounded-full bg-[#222226] shadow-[0_8px_20px_rgba(0,0,0,0.5)] border border-white/5",
        className,
      )}
    >
      {lookAngle === "right" ? (
        <>
          {/* Olhos alinhados sem rotação de graus */}
          <div
            aria-hidden="true"
            className="absolute left-[19px] top-[11px] h-[16px] w-[8.5px] rounded-[5px] bg-[#d0d0d4] shadow-sm"
          />
          <div
            aria-hidden="true"
            className="absolute left-[34px] top-[11px] h-[16px] w-[8.5px] rounded-[5px] bg-[#d0d0d4] shadow-sm"
          />
        </>
      ) : (
        <>
          <div
            aria-hidden="true"
            style={{
              transform: `translateX(${offset * 0.4}px)`,
            }}
            className="absolute left-[14px] top-1/2 -mt-[8px] h-[16px] w-[8.5px] rounded-[5px] bg-[#d0d0d4] transition-transform duration-500 ease-out"
          />
          <div
            aria-hidden="true"
            style={{
              transform: `translateX(${offset * 0.4}px)`,
            }}
            className="absolute left-[31px] top-1/2 -mt-[8px] h-[16px] w-[8.5px] rounded-[5px] bg-[#d0d0d4] transition-transform duration-500 ease-out"
          />
        </>
      )}
    </div>
  );
}

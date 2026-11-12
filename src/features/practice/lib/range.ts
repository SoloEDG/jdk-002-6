import type { PracticeConfig } from "../../../shared/session";
export function normalize(
  config: PracticeConfig,
  beats: number,
): PracticeConfig {
  const start = Math.max(
    0,
    Math.min(beats - 4, Math.round(config.start / 4) * 4),
  );
  return {
    enabled: config.enabled,
    speed: Math.max(0.5, Math.min(1.25, config.speed)),
    start,
    end: Math.max(start + 4, Math.min(beats, Math.round(config.end / 4) * 4)),
  };
}
export function rangeLabel(start: number, end: number) {
  return `${Math.floor(start / 4) + 1} — ${Math.ceil(end / 4)} 小节`;
}
/**
 * 漏音所在小节 + 相邻下一小节，共 8 拍。
 * 末尾不足 8 拍时向前补齐，并对齐到小节起点，保证片段始终完整。
 */
export function missWindow(beats: number, beat: number) {
  const barStart = Math.floor(beat / 4) * 4;
  let start = barStart;
  const end = Math.min(beats, barStart + 8);
  if (end - start < 8) start = Math.max(0, Math.floor((end - 8) / 4) * 4);
  return { start, end };
}

import type { Lane, Note, Track } from "./chart";
export type Phase = "ready" | "playing" | "paused" | "finished";
export type Grade = "PERFECT" | "GREAT" | "GOOD" | "MISS";
export type Hit = { noteId: string; grade: Grade; delta: number; beat: number };
export type Run = {
  id: string;
  track: Track;
  practice: boolean;
  speed: number;
  start: number;
  end: number;
  notes: Note[];
};
export type Result = {
  id: string;
  trackId: string;
  title: string;
  at: number;
  score: number;
  accuracy: number;
  maxCombo: number;
  hits: Hit[];
  practice: boolean;
  speed: number;
};
export type PracticeConfig = {
  enabled: boolean;
  speed: number;
  start: number;
  end: number;
};
/** 最近一次完整演出中被选中的漏音，以及它预填的练习区间。 */
export type PracticeFocus = {
  resultId: string;
  noteId: string;
  beat: number;
  lanes: Lane[];
  duration: number;
  start: number;
  end: number;
};
/**
 * 片段内可演奏的音符：起点落在 [start, end) 才算进入判定范围；
 * 尾端越界的长按在片段末尾截断，让画出的长度与实际判定结束拍一致。
 */
export function notesInRange(notes: Note[], start: number, end: number) {
  return notes
    .filter((n) => n.beat >= start && n.beat < end)
    .map((n) => (n.beat + n.duration <= end ? n : { ...n, duration: end - n.beat }));
}
export function makeRun(track: Track, config: PracticeConfig): Run {
  const start = config.enabled ? config.start : 0;
  const end = config.enabled ? config.end : track.beats;
  return {
    id: crypto.randomUUID(),
    track,
    practice: config.enabled,
    speed: config.enabled ? config.speed : 1,
    start,
    end,
    notes: notesInRange(track.notes, start, end),
  };
}

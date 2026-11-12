import type { Lane, Track } from "../../../shared/chart";
import type { Result, Run, Hit } from "../../../shared/session";
export function makeResult(
  run: Run,
  hits: Hit[],
  stats: { score: number; accuracy: number; maxCombo: number },
): Result {
  return {
    id: run.id,
    trackId: run.track.id,
    title: run.track.title,
    at: Date.now(),
    ...stats,
    hits: [...hits],
    practice: run.practice,
    speed: run.speed,
  };
}
export function rank(accuracy: number) {
  return accuracy >= 98
    ? "S"
    : accuracy >= 90
      ? "A"
      : accuracy >= 75
        ? "B"
        : "C";
}
export function bestFor(records: Result[], trackId: string) {
  return records
    .filter((r) => r.trackId === trackId && !r.practice)
    .sort((a, b) => b.score - a.score)[0];
}
/** 最近一次完整演出（练习成绩不算）。 */
export function latestShow(records: Result[]) {
  return records.find((r) => !r.practice) ?? null;
}
export type MissNote = {
  noteId: string;
  beat: number;
  lanes: Lane[];
  duration: number;
};
/** 从一次完整演出中取出漏音；按拍数排序，只包含该曲目谱面上的音符。 */
export function missesOf(result: Result, track: Track): MissNote[] {
  if (result.trackId !== track.id) return [];
  return result.hits
    .filter((h) => h.grade === "MISS")
    .map((h) => {
      const note = track.notes.find((n) => n.id === h.noteId);
      return note
        ? {
            noteId: note.id,
            beat: note.beat,
            lanes: note.lanes,
            duration: note.duration,
          }
        : null;
    })
    .filter((m): m is MissNote => m !== null)
    .sort((a, b) => a.beat - b.beat);
}

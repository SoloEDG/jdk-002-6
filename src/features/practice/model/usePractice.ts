import { ref } from "vue";
import type { Lane } from "../../../shared/chart";
import type { PracticeConfig, PracticeFocus } from "../../../shared/session";
import { missWindow, normalize } from "../lib/range";
export type FocusNote = {
  noteId: string;
  beat: number;
  lanes: Lane[];
  duration: number;
};
export function usePractice() {
  const config = ref<PracticeConfig>({
    enabled: false,
    speed: 0.75,
    start: 0,
    end: 64,
  });
  /** 已确认的漏音目标，驱动演出区高亮。 */
  const focus = ref<PracticeFocus | null>(null);
  /** 已选中、等待确认的预览；确认前不影响当前练习配置。 */
  const pending = ref<PracticeFocus | null>(null);
  function update(patch: Partial<PracticeConfig>, beats: number) {
    config.value = normalize({ ...config.value, ...patch }, beats);
  }
  function reset(beats: number) {
    config.value = { ...config.value, start: 0, end: beats };
    focus.value = null;
    pending.value = null;
  }
  /** 预填漏音所在小节及相邻下一小节；此时不改动当前练习配置。 */
  function preview(note: FocusNote, resultId: string, beats: number) {
    const range = missWindow(beats, note.beat);
    // 与确认后的配置走同一套归一化，保证预览和实际练习区间完全一致。
    const aligned = normalize(
      { ...config.value, start: range.start, end: range.end },
      beats,
    );
    pending.value = {
      resultId,
      noteId: note.noteId,
      beat: note.beat,
      lanes: note.lanes,
      duration: note.duration,
      start: aligned.start,
      end: aligned.end,
    };
  }
  /** 取消只丢弃预览，当前练习配置与已确认的漏音目标保持不变。 */
  function cancel() {
    pending.value = null;
  }
  function clearFocus() {
    focus.value = null;
  }
  /** 确认预填区间并启用练习，速度沿用当前练习配置。 */
  function confirm(beats: number) {
    const p = pending.value;
    if (!p) return false;
    const { start, end } = missWindow(beats, p.beat);
    config.value = normalize(
      { ...config.value, enabled: true, start, end },
      beats,
    );
    focus.value = {
      ...p,
      start: config.value.start,
      end: config.value.end,
    };
    pending.value = null;
    return true;
  }
  return {
    config,
    focus,
    pending,
    update,
    reset,
    preview,
    cancel,
    clearFocus,
    confirm,
  };
}

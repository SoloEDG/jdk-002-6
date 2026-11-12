import { computed, onMounted, onUnmounted, ref } from "vue";
import { useLibrary } from "../features/library";
import { usePerformance } from "../features/performance";
import { useJudgment, bindInput } from "../features/judgment";
import { usePractice } from "../features/practice";
import { useRecords, makeResult, missesOf } from "../features/records";
import { makeRun, notesInRange } from "../shared/session";
import type { PracticeConfig } from "../shared/session";
import type { Lane } from "../shared/chart";

export function useWorkspace() {
  const library = useLibrary(),
    practice = usePractice(),
    judgment = useJudgment(),
    records = useRecords(),
    error = ref("");
  const performance = usePerformance(
    (t) => judgment.tick(t),
    () => {
      if (!performance.run.value) return;
      records.commit(
        makeResult(
          performance.run.value,
          judgment.hits.value,
          judgment.stats.value,
        ),
      );
      // 新的完整演出会替换漏音来源，旧的目标不再可用。
      if (!performance.run.value.practice) {
        practice.cancel();
        practice.clearFocus();
      }
    },
  );
  /** 未开始演奏时舞台上展示的音符：练习模式下与之后实际判定范围一致。 */
  const idleNotes = computed(() => {
    const cfg = practice.config.value,
      track = library.selected.value;
    return cfg.enabled
      ? notesInRange(track.notes, cfg.start, cfg.end)
      : track.notes;
  });
  const locked = computed(
    () =>
      performance.phase.value === "playing" ||
      performance.phase.value === "paused",
  );
  /** 最近一次完整演出（练习不计），漏音只从这里选取。 */
  const lastShow = computed(() => records.latestFull.value);
  /** 仅当最近一次完整演出就是当前曲目时才作为漏音来源。 */
  const missSource = computed(() => {
    const show = lastShow.value;
    return show && show.trackId === library.selectedId.value ? show : null;
  });
  const misses = computed(() => {
    const show = missSource.value;
    return show ? missesOf(show, library.selected.value) : [];
  });
  /** 已确认、且仍指向当前曲目最近一次完整演出的目标，用于舞台高亮。 */
  const stageFocus = computed(() => {
    const f = practice.focus.value,
      show = missSource.value;
    if (!f || !show) return null;
    return show.id === f.resultId ? f : null;
  });
  async function start() {
    // 直接开始播放时，尚未确认的漏音预览不再有意义（已确认的目标保留）。
    practice.cancel();
    const run = makeRun(library.selected.value, practice.config.value);
    judgment.reset(run);
    error.value = "";
    try {
      await performance.start(run);
    } catch {
      error.value = "音频未能启动，请再次点击开始";
      performance.reset();
    }
  }
  function select(id: string) {
    if (locked.value) return;
    library.select(id);
    practice.reset(library.selected.value.beats);
    performance.reset();
    judgment.reset(makeRun(library.selected.value, practice.config.value));
  }
  /** 选中漏音只做预览，不改动当前练习配置，也不开始播放。 */
  function pickMiss(noteId: string) {
    const show = missSource.value;
    if (locked.value || !show) return;
    const note = misses.value.find((m) => m.noteId === noteId);
    if (note) practice.preview(note, show.id, library.selected.value.beats);
  }
  function cancelMiss() {
    if (!locked.value) practice.cancel();
  }
  /** 确认预填区间后，以当前练习速度立即开始。 */
  function confirmMiss() {
    if (locked.value) return;
    if (practice.confirm(library.selected.value.beats)) void start();
  }
  function down(lane: Lane) {
    if (performance.phase.value === "playing")
      judgment.down(lane, performance.time.value);
  }
  function up(lane: Lane) {
    if (performance.phase.value === "playing")
      judgment.up(lane, performance.time.value);
  }
  function pause() {
    performance.pause();
    judgment.clearHeld();
  }
  function toggle() {
    if (performance.phase.value === "playing") pause();
    else if (performance.phase.value === "paused") void performance.resume();
  }
  function updatePractice(patch: Partial<PracticeConfig>) {
    if (locked.value) return;
    practice.update(patch, library.selected.value.beats);
    // 手动改动区间或练习开关时，漏音目标与预览随之作废；调速度不影响。
    if (
      patch.enabled !== undefined ||
      patch.start !== undefined ||
      patch.end !== undefined
    ) {
      practice.cancel();
      practice.clearFocus();
    }
  }
  let cleanup = () => {};
  const blur = () => {
    if (performance.phase.value === "playing") pause();
  };
  onMounted(() => {
    cleanup = bindInput(down, up, toggle);
    window.addEventListener("blur", blur);
  });
  onUnmounted(() => {
    cleanup();
    window.removeEventListener("blur", blur);
    performance.reset();
  });
  return {
    library,
    practice,
    judgment,
    records,
    performance,
    locked,
    error,
    lastShow,
    missSource,
    misses,
    stageFocus,
    idleNotes,
    start,
    select,
    pickMiss,
    confirmMiss,
    cancelMiss,
    down,
    up,
    pause,
    updatePractice,
  };
}

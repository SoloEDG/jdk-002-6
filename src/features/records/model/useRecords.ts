import { computed, ref } from "vue";
import type { Result } from "../../../shared/session";
import { loadRecords, saveRecords } from "../lib/storage";
import { latestShow } from "../lib/summary";
export function useRecords() {
  const records = ref(loadRecords()),
    latest = ref<Result | null>(null),
    warning = ref("");
  const latestFull = computed(() => latestShow(records.value));
  function commit(result: Result) {
    if (records.value.some((r) => r.id === result.id)) return;
    latest.value = result;
    records.value = [result, ...records.value].slice(0, 30);
    if (!saveRecords(records.value))
      warning.value = "存储空间不足，本次记录仅在当前页面保留";
  }
  return { records, latest, latestFull, warning, commit };
}

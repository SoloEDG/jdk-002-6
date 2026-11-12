<script setup lang="ts">
import type { Result } from "../../../shared/session";
import { barOf, laneLabels } from "../../../shared/chart";
import type { MissNote } from "../lib/summary";
const props = defineProps<{
  misses: MissNote[];
  source: Result | null;
  available: boolean;
  selectedId: string;
  locked: boolean;
}>();
defineEmits<{ pick: [noteId: string] }>();
const beatLabel = (beat: number) => (beat % 4 === 0 ? "正拍" : `+${beat % 4}`);
</script>
<template>
  <section class="misses panel">
    <div class="section-label">
      06 / MISSED NOTES <span>最近一次演出</span>
    </div>
    <div v-if="!source" class="misses-empty">
      <p>完成一次完整演出后，可在这里选中漏音进行专项练习。</p>
    </div>
    <div v-else-if="!available" class="misses-empty">
      <p>
        最近一次完整演出是《{{ source.title }}》，切回该曲目后可选漏音。
      </p>
    </div>
    <div v-else-if="!misses.length" class="misses-empty">
      <p>《{{ source.title }}》上次没有漏音，继续保持。</p>
    </div>
    <template v-else>
      <p class="misses-hint">
        选中一条漏音，将预填它所在的小节及下一小节，确认后再开始。
      </p>
      <div class="miss-list">
        <button
          v-for="m in misses"
          :key="m.noteId"
          class="miss-row"
          :class="{ selected: m.noteId === selectedId }"
          :disabled="locked"
          @click="$emit('pick', m.noteId)"
        >
          <span class="miss-beat"
            >第 {{ barOf(m.beat) }} 小节<small
              >{{ beatLabel(m.beat) }} · 拍 {{ m.beat }}</small
            ></span
          ><span class="miss-lanes">
            <i v-for="l in m.lanes" :key="l">{{ laneLabels[l] }}</i>
          </span>
          <span v-if="m.duration" class="miss-hold">长按 {{ m.duration }} 拍</span>
        </button>
      </div>
    </template>
  </section>
</template>

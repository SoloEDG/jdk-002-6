<script setup lang="ts">
import { computed } from "vue";
import type { Track } from "../../../shared/chart";
import { barOf, laneLabels } from "../../../shared/chart";
import type { PracticeConfig, PracticeFocus } from "../../../shared/session";
import { rangeLabel } from "../lib/range";
import BeatTimeline from "./BeatTimeline.vue";
const props = defineProps<{
  track: Track;
  config: PracticeConfig;
  focus: PracticeFocus | null;
  preview: PracticeFocus | null;
  locked: boolean;
}>();
defineEmits<{
  update: [patch: Partial<PracticeConfig>];
  confirm: [];
  cancel: [];
}>();
const previewing = computed(() => props.preview !== null);
/** 预览优先展示待确认区间；否则展示当前生效的练习区间。 */
const shownStart = computed(() =>
  previewing.value ? props.preview!.start : props.config.start,
);
const shownEnd = computed(() =>
  previewing.value ? props.preview!.end : props.config.end,
);
const target = computed(() => props.preview ?? props.focus);
const targetLanes = computed(() =>
  target.value ? target.value.lanes.map((l) => laneLabels[l]).join(" ") : "",
);
</script>
<template>
  <section class="practice panel">
    <div class="section-label">
      04 / PRACTICE LAB
      <label class="toggle"
        ><input
          aria-label="练习模式"
          type="checkbox"
          :disabled="locked"
          :checked="config.enabled"
          @change="
            $emit('update', {
              enabled: ($event.target as HTMLInputElement).checked,
            })
          " /><span></span
      ></label>
    </div>
    <div class="practice-heading">
      <h3>把难点，变成肌肉记忆</h3>
      <p class="muted">独立练习成绩不计入最佳纪录</p>
    </div>
    <div v-if="target" class="focus-preview" :class="{ active: !previewing }">
      <div class="focus-head">
        <span>漏音目标</span>
        <b>第 {{ barOf(target.beat) }} 小节</b>
        <small>{{ targetLanes }}</small>
      </div>
      <template v-if="previewing">
        <p class="focus-range">
          预填片段 <b>{{ rangeLabel(target.start, target.end) }}</b
          ><span>拍 {{ target.start }} → {{ target.end }}</span>
        </p>
        <p class="focus-caption">
          以当前速度 {{ config.speed.toFixed(2) }}× 开始练习，原练习区间保持不变
        </p>
        <div class="focus-actions">
          <button class="primary" :disabled="locked" @click="$emit('confirm')">
            确认并开练</button
          ><button class="ghost" :disabled="locked" @click="$emit('cancel')">
            取消
          </button>
        </div>
      </template>
      <p v-else class="focus-caption">已定位到练习区间，舞台上会标出这条漏音。</p>
    </div>
    <div class="speed-row">
      <span>播放速度</span><b>{{ config.speed.toFixed(2) }}×</b>
    </div>
    <div class="speed-buttons">
      <button
        v-for="v in [0.5, 0.75, 1, 1.25]"
        :key="v"
        :disabled="locked || !config.enabled"
        :class="{ active: config.speed === v }"
        @click="$emit('update', { speed: v })"
      >
        {{ v }}×
      </button>
    </div>
    <BeatTimeline
      :track="track"
      :start="shownStart"
      :end="shownEnd"
      :preview="previewing"
    />
    <div class="range-heading">
      <span>{{ previewing ? "待确认片段" : "练习片段" }}</span
      ><b>{{ rangeLabel(shownStart, shownEnd) }}</b>
    </div>
    <div class="range-inputs">
      <label
        >起始拍<input
          aria-label="起始拍"
          type="number"
          min="0"
          :max="track.beats - 4"
          step="4"
          :disabled="locked || !config.enabled || previewing"
          :value="shownStart"
          @change="
            $emit('update', {
              start: Number(($event.target as HTMLInputElement).value),
            })
          " /></label
      ><span>→</span
      ><label
        >结束拍<input
          aria-label="结束拍"
          type="number"
          min="4"
          :max="track.beats"
          step="4"
          :disabled="locked || !config.enabled || previewing"
          :value="shownEnd"
          @change="
            $emit('update', {
              end: Number(($event.target as HTMLInputElement).value),
            })
          "
      /></label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Temporal } from '@js-temporal/polyfill'
import { onUnmounted, ref, watch } from 'vue'
import { TimerState } from '../../../api-facade/models/timers-models'
import UiTimestamp from '../../../components/ui/UiTimestamp.vue'
import { useApiTimerStore } from '../../../stores/api/apiTimerStore'
import { useFeatureGameStore } from '../../../stores/feature/featureGameStore'

const gameStore = useFeatureGameStore()
const timerStore = useApiTimerStore()

const elapsed = ref(Temporal.Duration.from({ seconds: 0 }))
let interval: ReturnType<typeof setInterval> | null = null

watch(
	() => gameStore.current?.timeSpent,
	(timeSpent) => {
		if (timeSpent !== undefined) elapsed.value = timeSpent
	},
	{ immediate: true },
)

watch(
	() => timerStore.state,
	(state) => {
		if (interval) {
			clearInterval(interval)
			interval = null
		}
		if (state === TimerState.Running) {
			interval = setInterval(() => {
				elapsed.value = elapsed.value.add({ seconds: 1 })
			}, 1000)
		}
	},
	{ immediate: true },
)

onUnmounted(() => {
	if (interval) clearInterval(interval)
})
</script>

<template>
	<UiTimestamp v-if="gameStore.current" :time="elapsed" />
</template>

<style scoped></style>

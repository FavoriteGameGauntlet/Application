<script setup lang="ts">
import { Temporal } from '@js-temporal/polyfill'
import UiTimestamp from '../../../components/ui/UiTimestamp.vue'
import { useFeatureGameStore } from '../../../stores/feature/featureGameStore'
import { useFeatureTimerStore } from '../../../stores/feature/featureTimerStore'
import { computed } from 'vue'

const gameStore = useFeatureGameStore()
const timerStore = useFeatureTimerStore()

const elapsed = computed(() => {
	const gameElapsed =
		gameStore.current?.timeSpent ?? Temporal.Duration.from({ seconds: 0 })
	const timerElapsed = timerStore.durationLeft.subtract(timerStore.remaining)
	return gameElapsed.add(timerElapsed)
})
</script>

<template>
	<UiTimestamp :time="elapsed" />
</template>

<style scoped></style>

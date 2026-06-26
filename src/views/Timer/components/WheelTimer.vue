<script setup lang="ts">
import { Temporal } from '@js-temporal/polyfill'
import { watch } from 'vue'
import { TimerState } from '../../../api-facade/models/timers-models'
import UiTimestamp from '../../../components/ui/UiTimestamp.vue'
import { useTimer } from '../../../composables/useTimer'
import { useApiTimerStore } from '../../../stores/api/apiTimerStore'

const { elapsed, start, stop } = useTimer({ mode: 'subtract' })

const timerStore = useApiTimerStore()

const calcElapsed = () => {
	if (!timerStore.lastActionDate || timerStore.state !== TimerState.Running)
		return timerStore.durationLeft

	const now = Temporal.Now.instant()
	const timeSinceLastAction = now.since(timerStore.lastActionDate)

	return timerStore.durationLeft.subtract(timeSinceLastAction)
}

watch(
	() => timerStore.durationLeft,
	() => {
		elapsed.value = calcElapsed()
	},
	{ immediate: true },
)

watch(elapsed, () => {
	if (elapsed.value.sign !== -1) return

	stop()
	elapsed.value = Temporal.Duration.from({ seconds: 0 })
	timerStore.state = TimerState.Finished
	timerStore.getCurrent()
})

watch(
	() => timerStore.state,
	(state) => {
		if (state === TimerState.Running) {
			start()
		} else {
			stop()
		}
	},
	{ immediate: true },
)
</script>

<template>
	<UiTimestamp :time="elapsed" />
</template>

<style scoped></style>

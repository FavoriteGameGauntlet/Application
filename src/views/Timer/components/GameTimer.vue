<script setup lang="ts">
import { Temporal } from '@js-temporal/polyfill'
import { watch } from 'vue'
import { TimerState } from '../../../api-facade/models/timers-models'
import UiTimestamp from '../../../components/ui/UiTimestamp.vue'
import { useTimer } from '../../../composables/useTimer'
import { useApiGameStore } from '../../../stores/api/apiGameStore'
import { useApiTimerStore } from '../../../stores/api/apiTimerStore'

type Props = {
	login: string
}

const gameStore = useApiGameStore()
const timerStore = useApiTimerStore()

const { login } = defineProps<Props>()

const { elapsed, start, stop } = useTimer({ mode: 'add' })

const calcElapsed = () => {
	const base =
		gameStore.current[login]?.timeSpent ?? Temporal.Duration.from({ seconds: 0 })

	if (!timerStore.lastActionDate || timerStore.state !== TimerState.Running)
		return base

	return base.add(Temporal.Now.instant().since(timerStore.lastActionDate))
}

watch(
	() => timerStore.durationLeft,
	() => {
		if (timerStore.state !== TimerState.Running) return
		elapsed.value = calcElapsed()
	},
	{ immediate: true },
)

watch(
	() => gameStore.current[login],
	(game) => {
		if (!game) return
		elapsed.value = calcElapsed()
	},
	{ immediate: true },
)

watch(
	() => timerStore.state,
	(state) => {
		console.log(state)
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

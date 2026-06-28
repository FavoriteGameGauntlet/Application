import { Temporal } from '@js-temporal/polyfill'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { TimerState } from '../../api-facade/models/timers-models'
import { StoreName } from '../../enums/storeName'
import { useApiTimerStore } from '../api/apiTimerStore'
import { useAuthStore } from '../authStore'
import { useFeatureGameStore } from './featureGameStore'

export const useFeatureTimerStore = defineStore(StoreName.FeatureTimer, () => {
	const timerStore = useApiTimerStore()
	const authStore = useAuthStore()
	const gameStore = useFeatureGameStore()

	const state = computed(() => timerStore.state)

	const durationLeft = computed(() => timerStore.durationLeft)
	const durationTotal = computed(() => timerStore.durationTotal)

	const loading = computed(
		() =>
			timerStore.toggleState.isLoading || timerStore.getCurrentState.isLoading,
	)

	const toggle = () => timerStore.toggle()

	const remaining = ref(Temporal.Duration.from({ seconds: 0 }))
	let interval: ReturnType<typeof setInterval> | null = null

	const calcRemaining = (): Temporal.Duration => {
		if (!timerStore.lastActionDate || timerStore.state !== TimerState.Running)
			return timerStore.durationLeft

		const elapsed = Temporal.Now.instant().since(timerStore.lastActionDate)
		if (elapsed.sign < 0) return timerStore.durationLeft

		return timerStore.durationLeft
			.subtract(elapsed)
			.round({ largestUnit: 'hour', smallestUnit: 'second', roundingMode: 'ceil' })
	}

	watch(
		() => timerStore.state,
		(newState, oldState) => {
			if (interval) {
				clearInterval(interval)
				interval = null
			}

			if (oldState !== TimerState.Running) {
				remaining.value = calcRemaining()
			}

			if (newState === TimerState.Running) {
				interval = setInterval(() => {
					remaining.value = calcRemaining()

					if (remaining.value.total({ unit: 'seconds' }) <= 0) {
						clearInterval(interval!)
						interval = null
						remaining.value = Temporal.Duration.from({ seconds: 0 })
						timerStore.state = TimerState.Finished
						timerStore.getCurrent()
					}
				}, 1000)
			}
		},
		{ immediate: true },
	)

	watch(
		() => timerStore.durationLeft,
		() => {
			remaining.value = calcRemaining()
		},
	)

	const remainingAtLastGameUpdate = ref(Temporal.Duration.from({ seconds: 0 }))

	watch(
		() => gameStore.current?.timeSpent,
		() => {
			remainingAtLastGameUpdate.value = remaining.value
		},
		{ immediate: true },
	)

	const elapsed = computed(() => {
		const timeSpent =
			gameStore.current?.timeSpent ?? Temporal.Duration.from({ seconds: 0 })
		const timerElapsed = remainingAtLastGameUpdate.value.subtract(remaining.value)
		if (timerElapsed.sign < 0) return timeSpent
		return timeSpent.add(timerElapsed)
	})

	const init = () => {
		// Get current timer on login
		watch(
			() => authStore.isLoggedIn,
			(isLoggedIn) => {
				if (isLoggedIn) {
					timerStore.getCurrent()
				} else {
					timerStore.state = null
				}
			},
			{ immediate: true },
		)
	}

	return {
		state,

		durationLeft,
		durationTotal,
		remaining,
		elapsed,

		loading,

		toggle,
		/** @todo add wheelStore.pendingRoll to condition */
		canToggle: computed(() => timerStore.canToggle),

		init,
	}
})

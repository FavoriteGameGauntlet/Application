import { Temporal } from '@js-temporal/polyfill'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { TimerState } from '../../api-facade/models/timers-models'
import { StoreName } from '../../enums/storeName'
import { useApiTimerStore } from '../api/apiTimerStore'
import { useAuthStore } from '../authStore'
import { useFeatureGameStore } from './featureGameStore'
import { useFeatureWheelStore } from './featureWheelStore'

export const useFeatureTimerStore = defineStore(StoreName.FeatureTimer, () => {
	const timerStore = useApiTimerStore()
	const authStore = useAuthStore()
	const gameStore = useFeatureGameStore()
	const wheelStore = useFeatureWheelStore()

	const loading = computed(
		() =>
			timerStore.toggleState.isLoading || timerStore.getCurrentState.isLoading,
	)

	const remaining = ref(Temporal.Duration.from({ seconds: 0 }))
	let interval: ReturnType<typeof setInterval> | null = null

	const calcRemaining = (): Temporal.Duration => {
		if (!timerStore.syncedAt || timerStore.state !== TimerState.Running)
			return timerStore.durationLeft

		const sinceSync = Temporal.Now.instant().since(timerStore.syncedAt)

		const left = timerStore.durationLeft.subtract(sinceSync)
		if (left.sign <= 0) return Temporal.Duration.from({ seconds: 0 })

		const floored = left.round({
			largestUnit: 'hour',
			smallestUnit: 'second',
			roundingMode: 'floor',
		})

		return floored.total({ unit: 'seconds' }) > 0
			? floored
			: Temporal.Duration.from({ seconds: 1 })
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
						timerStore.markFinished()
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
		[() => gameStore.current?.timeSpent, remaining],
		([newTimeSpent], [prevTimeSpent]) => {
			if (
				newTimeSpent !== prevTimeSpent ||
				remainingAtLastGameUpdate.value.total({ unit: 'seconds' }) === 0
			) {
				remainingAtLastGameUpdate.value = remaining.value
			}
		},
		{ immediate: true },
	)

	const elapsed = computed(() => {
		const timeSpent =
			gameStore.current?.timeSpent ?? Temporal.Duration.from({ seconds: 0 })
		const sinceLastUpdate = remainingAtLastGameUpdate.value.subtract(
			remaining.value,
		)
		if (sinceLastUpdate.sign < 0) return timeSpent
		return timeSpent.add(sinceLastUpdate)
	})

	const init = () => {
		// Get current timer on login
		watch(
			() => authStore.isLoggedIn,
			(isLoggedIn) => {
				if (isLoggedIn) {
					timerStore.getCurrent()
				} else {
					timerStore.reset()
				}
			},
			{ immediate: true },
		)
	}

	return {
		state: computed(() => timerStore.state),

		durationTotal: computed(() => timerStore.durationTotal),
		remaining,
		elapsed,

		loading,

		toggle: timerStore.toggle,
		canToggle: computed(() => timerStore.canToggle && !wheelStore.pendingRoll),

		init,
	}
})

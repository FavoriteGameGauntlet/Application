import { Temporal } from '@js-temporal/polyfill'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { TimerState } from '../../api-facade/models/timers-models'
import { ZERO, ONE_SECOND } from '../../constants/durations'
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

	const { state, durationLeft, durationTotal, lastActionDate } =
		storeToRefs(timerStore)
	const { isLoggedIn } = storeToRefs(authStore)

	const loading = computed(
		() =>
			timerStore.toggleState.isLoading || timerStore.getCurrentState.isLoading,
	)

	const timerUnavailable = computed(
		() =>
			(timerStore.getCurrentState.isLoaded ||
				timerStore.getCurrentState.isError) &&
			state.value === null,
	)

	const remaining = ref(ZERO)
	let interval: ReturnType<typeof setInterval> | null = null

	const stopInterval = () => {
		if (interval) {
			clearInterval(interval)
			interval = null
		}
	}

	const calcRemaining = (): Temporal.Duration => {
		if (!lastActionDate.value || state.value !== TimerState.Running)
			return durationLeft.value

		const sinceLastAction = Temporal.Now.instant().since(lastActionDate.value)

		const left = durationLeft.value.subtract(
			sinceLastAction.sign < 0 ? ZERO : sinceLastAction,
		)
		if (left.sign <= 0) return ZERO

		const floored = left.round({
			largestUnit: 'hour',
			smallestUnit: 'second',
			roundingMode: 'floor',
		})

		return floored.sign > 0 ? floored : ONE_SECOND
	}

	watch(
		[state, durationLeft],
		([newState]) => {
			stopInterval()
			remaining.value = calcRemaining()

			if (newState === TimerState.Running) {
				interval = setInterval(() => {
					remaining.value = calcRemaining()

					if (remaining.value.sign <= 0) {
						stopInterval()
						timerStore.markFinished()
					}
				}, 1000)
			}
		},
		{ immediate: true },
	)

	const init = () => {
		watch(
			isLoggedIn,
			(loggedIn) => {
				if (loggedIn) {
					timerStore.getCurrent()
				} else {
					timerStore.reset()
				}
			},
			{ immediate: true },
		)

		watch(
			() => gameStore.current,
			(current, previous) => {
				if (current && !previous) {
					timerStore.getCurrent()
				} else if (!current) {
					timerStore.reset()
				}
			},
		)
	}

	return {
		state,

		durationTotal,
		remaining,

		loading,
		timerUnavailable,

		toggle: timerStore.toggle,
		canToggle: computed(() => timerStore.canToggle && !wheelStore.pendingRoll),

		init,
	}
})

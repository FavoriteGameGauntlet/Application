import { Temporal } from '@js-temporal/polyfill'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { TimerState } from '../../api-facade/models/timers-models'
import { StoreName } from '../../enums/storeName'
import { useApiTimerStore } from '../api/apiTimerStore'
import { useAuthStore } from '../authStore'
import { useFeatureGameStore } from './featureGameStore'
import { useFeatureWheelStore } from './featureWheelStore'

const ZERO = Temporal.Duration.from({ seconds: 0 })
const ONE_SECOND = Temporal.Duration.from({ seconds: 1 })

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

		const left = durationLeft.value.subtract(sinceLastAction)
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

	const remainingAtLastGameUpdate = ref(ZERO)

	watch(
		[() => gameStore.current?.timeSpent, remaining],
		([newTimeSpent], [prevTimeSpent]) => {
			if (
				newTimeSpent !== prevTimeSpent ||
				remainingAtLastGameUpdate.value.sign === 0
			) {
				remainingAtLastGameUpdate.value = remaining.value
			}
		},
		{ immediate: true },
	)

	const elapsed = computed(() => {
		const timeSpent = gameStore.current?.timeSpent ?? ZERO
		const sinceLastUpdate = remainingAtLastGameUpdate.value.subtract(
			remaining.value,
		)
		if (sinceLastUpdate.sign < 0) return timeSpent
		return timeSpent.add(sinceLastUpdate)
	})

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
	}

	return {
		state,

		durationTotal,
		remaining,
		elapsed,

		loading,

		toggle: timerStore.toggle,
		canToggle: computed(() => timerStore.canToggle && !wheelStore.pendingRoll),

		init,
	}
})

import { Temporal } from '@js-temporal/polyfill'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { TimerState } from '../../api-facade/models/timers-models'
import { StoreName } from '../../enums/storeName'
import { useApiTimerStore } from '../api/apiTimerStore'
import { useAuthStore } from '../authStore'

export const useFeatureTimerStore = defineStore(StoreName.FeatureTimer, () => {
	const timerStore = useApiTimerStore()
	const authStore = useAuthStore()

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

		return timerStore.durationLeft.subtract(
			Temporal.Now.instant().since(timerStore.lastActionDate),
		)
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

		loading,

		toggle,
		/** @todo add wheelStore.pendingRoll to condition */
		canToggle: computed(() => timerStore.canToggle),

		init,
	}
})

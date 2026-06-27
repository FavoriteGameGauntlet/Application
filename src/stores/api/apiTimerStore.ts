import { Temporal } from '@js-temporal/polyfill'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '../../api-facade/api'
import type { HttpErrorResponse } from '../../api-facade/http'
import { TimerState } from '../../api-facade/models/timers-models'
import { StoreName } from '../../enums/storeName'
import {
	LoadingStatus,
	makeLoadingState,
	withLoading,
} from '../../utils/loadingState'

const DEFAULT_DURATION = Temporal.Duration.from({
	hours: 2,
	minutes: 0,
	seconds: 0,
})

export const useApiTimerStore = defineStore(StoreName.ApiTimer, () => {
	const state = ref<TimerState | null>(null)
	const durationTotal = ref(Temporal.Duration.from(DEFAULT_DURATION))

	const lastActionDate = ref<Temporal.Instant | null>(null)
	const durationLeft = ref(Temporal.Duration.from({ hours: 0 }))

	const toggleState = makeLoadingState()

	const canStart = computed(() =>
		[null, TimerState.Created, TimerState.Paused, TimerState.Finished].includes(
			state.value,
		),
	)

	const canPause = computed(() => state.value === TimerState.Running)

	const canToggle = computed(() => canPause.value || canStart.value)

	const [getCurrent, getCurrentState] = withLoading(async (status) => {
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		await api.timers
			.getCurrent()
			.then((timer) => {
				durationTotal.value = timer.duration
				durationLeft.value = timer.remainingTime
				state.value = timer.state
				lastActionDate.value = timer.lastActionDate

				status.value = LoadingStatus.LOADED
			})
			.catch((error: HttpErrorResponse) => {
				if (error.body?.code === 'AVAILABLE_ROLLS_EXIST') {
					durationLeft.value = Temporal.Duration.from({ hours: 0 })
					state.value = null
					lastActionDate.value = null

					status.value = LoadingStatus.LOADED
					return
				}

				status.value = LoadingStatus.ERROR
				throw error
			})
	})

	const start = async () => {
		if (!canStart.value) return Promise.reject()
		if (toggleState.isLoading.value) return

		toggleState.status.value = LoadingStatus.LOADING

		const prevState = state.value
		const prevLastActionDate = lastActionDate.value

		state.value = TimerState.Running
		lastActionDate.value = Temporal.Now.instant()

		await api.timers
			.postStart()
			.then((timer) => {
				durationLeft.value = timer.remainingTime
				durationTotal.value = timer.duration
				lastActionDate.value = timer.lastActionDate

				toggleState.status.value = LoadingStatus.LOADED
			})
			.catch((error: HttpErrorResponse) => {
				if (error.body?.code === 'CURRENT_TIMER_NOT_FOUND') {
					state.value = null
					lastActionDate.value = null

					toggleState.status.value = LoadingStatus.LOADED
					return
				}

				state.value = prevState
				lastActionDate.value = prevLastActionDate

				toggleState.status.value = LoadingStatus.ERROR
				throw error
			})
	}

	const pause = async () => {
		if (!canPause.value) return Promise.reject()
		if (toggleState.isLoading.value) return

		toggleState.status.value = LoadingStatus.LOADING

		const prevLastActionDate = lastActionDate.value
		const prevState = state.value

		lastActionDate.value = Temporal.Now.instant()
		state.value = TimerState.Paused

		await api.timers
			.postPause()
			.then((timer) => {
				durationLeft.value = timer.remainingTime
				durationTotal.value = timer.duration
				lastActionDate.value = timer.lastActionDate

				toggleState.status.value = LoadingStatus.LOADED
			})
			.catch((error: HttpErrorResponse) => {
				if (error.body?.code === 'CURRENT_TIMER_NOT_FOUND') {
					state.value = null
					lastActionDate.value = null

					toggleState.status.value = LoadingStatus.LOADED
					return
				}

				state.value = prevState
				lastActionDate.value = prevLastActionDate

				toggleState.status.value = LoadingStatus.ERROR
				throw error
			})
	}

	const toggle = async () => {
		switch (state.value) {
			case TimerState.Created:
			case TimerState.Paused:
			case TimerState.Finished:
			case null:
				return start()
			case TimerState.Running:
				return pause()
		}
	}

	const remaining = ref(Temporal.Duration.from({ seconds: 0 }))
	let interval: ReturnType<typeof setInterval> | null = null

	const calcRemaining = (): Temporal.Duration => {
		if (!lastActionDate.value || state.value !== TimerState.Running)
			return durationLeft.value

		return durationLeft.value
			.subtract(Temporal.Now.instant().since(lastActionDate.value))
			.round({ largestUnit: 'hour', smallestUnit: 'second', roundingMode: 'ceil' })
	}

	watch(
		() => state.value,
		(newState) => {
			if (interval) { clearInterval(interval); interval = null }
			remaining.value = calcRemaining()

			if (newState === TimerState.Running) {
				interval = setInterval(() => {
					remaining.value = calcRemaining()

					if (remaining.value.total({ unit: 'seconds' }) <= 0) {
						clearInterval(interval!)
						interval = null
						remaining.value = Temporal.Duration.from({ seconds: 0 })
						state.value = TimerState.Finished
						getCurrent()
					}
				}, 1000)
			}
		},
		{ immediate: true },
	)

	watch(
		() => durationLeft.value,
		() => {
			remaining.value = calcRemaining()
		},
	)

	return {
		state,
		durationTotal,
		durationLeft,
		remaining,

		lastActionDate,

		canStart,
		canPause,
		canToggle,

		getCurrent,
		getCurrentState,

		start,
		pause,

		toggle,
		toggleState,
	}
})

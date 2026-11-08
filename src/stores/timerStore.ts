import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '../api-facade/api'
import type { Reward, Timer } from '../api-facade/contracts'
import type { HttpErrorResponse } from '../api-facade/http'
import { StoreName } from '../enums/storeName'
import { formatClock } from '../utils/format'
import { useCurrentGameStore } from './currentGameStore'
import { useJournalStore } from './journalStore'
import { useMembersStore } from './membersStore'
import { useResourcesStore } from './resourcesStore'
import { useToastStore } from './toastStore'

const DEFAULT_GOAL = 7200

export const useTimerStore = defineStore(StoreName.Timer, () => {
	const timer = ref<Timer>()

	const now = ref(Date.now())
	/** when the timer came from the server */
	const receivedAt = ref(Date.now())

	const goal = computed(() => timer.value?.duration ?? DEFAULT_GOAL)

	/** the server counts remainingTime up to the moment of the response, so the time is counted from it */
	const remaining = computed(() => {
		if (!timer.value) return goal.value
		if (timer.value.state !== 'running') return timer.value.remainingTime

		const passed = Math.floor((now.value - receivedAt.value) / 1000)

		return Math.max(0, timer.value.remainingTime - passed)
	})

	/** a timer that has run out is over, even before the server tells so */
	const isRunning = computed(
		() => timer.value?.state === 'running' && remaining.value > 0,
	)

	const elapsed = computed(() => goal.value - remaining.value)

	/** the clock texts for the screens; none while there is no timer */
	const clock = computed(() =>
		timer.value
			? {
					remaining: formatClock(remaining.value),
					goal: formatClock(goal.value).slice(1),
				}
			: undefined,
	)

	const set = (value: Timer) => {
		timer.value = value
		receivedAt.value = now.value = Date.now()
	}

	/** the server deletes the timer with its game, so «no timer» is an answer, not a failure */
	const load = async () => {
		try {
			set(await api.timer.get())
		} catch (e) {
			if (
				(e as Partial<HttpErrorResponse>).body?.code !==
				'CURRENT_TIMER_NOT_FOUND'
			)
				throw e

			timer.value = undefined
		}
	}

	/** the reward is the party's setting, so it is read apart from the timer and is there without one */
	const reward = ref<Reward>([])

	const loadReward = async () => {
		reward.value = await api.timer.reward()
	}

	/** the server has a timer only for a current game, so without a game there is nothing to ask for */
	const clear = () => {
		timer.value = undefined
	}

	const toggle = async () => {
		const toast = useToastStore()

		if (!useCurrentGameStore().current?.game) {
			toast.show('Нет текущей игры', 'Сначала выбери игру на колесе.', 'info')
			return
		}

		try {
			set(isRunning.value ? await api.timer.pause() : await api.timer.start())
			await useMembersStore().load()
		} catch (e) {
			toast.error(e)
		}
	}

	/** asks the server until it has finished the timer, then takes what the timer granted */
	let syncing = false

	const syncFinished = async () => {
		if (syncing) return
		syncing = true

		for (let attempt = 0; attempt < 10; attempt++) {
			try {
				await load()
			} catch {
				// the timer is being replaced, the next attempt gets the new one
			}

			if (!isRunning.value && remaining.value > 0) {
				await Promise.all([
					useMembersStore().load(),
					useResourcesStore().loadMine(),
				]).catch(() => {})
				useJournalStore().bump()
				break
			}

			await new Promise((resolve) => setTimeout(resolve, 500))
		}

		syncing = false
	}

	const init = () => {
		setInterval(() => {
			now.value = Date.now()
		}, 1000)

		// the server finishes the timer within a second after the end and starts the next one
		watch(
			() => timer.value?.state === 'running' && remaining.value === 0,
			(ended) => {
				if (ended) void syncFinished()
			},
		)
	}

	return {
		timer,
		goal,
		isRunning,
		remaining,
		elapsed,
		clock,
		reward,
		load,
		loadReward,
		clear,
		toggle,
		init,
	}
})

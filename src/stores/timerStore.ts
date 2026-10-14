import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { Timer } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useCurrentGameStore } from './currentGameStore'
import { useMembersStore } from './membersStore'
import { useToastStore } from './toastStore'

const DEFAULT_GOAL = 7200

export const useTimerStore = defineStore(StoreName.Timer, () => {
	const timer = ref<Timer>()

	const receivedAt = ref(Date.now())
	const now = ref(Date.now())

	const isRunning = computed(() => timer.value?.state === 'running')
	const goal = computed(() => timer.value?.goal ?? DEFAULT_GOAL)

	/** server value plus the time passed since it was received */
	const elapsed = computed(() => {
		if (!timer.value) return 0
		if (!isRunning.value) return timer.value.elapsed

		return Math.min(
			goal.value,
			timer.value.elapsed + Math.floor((now.value - receivedAt.value) / 1000),
		)
	})

	const set = (value: Timer) => {
		timer.value = value
		receivedAt.value = Date.now()
		now.value = receivedAt.value
	}

	const load = async () => {
		set(await api.timer.get())
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

	const init = () => {
		setInterval(() => {
			now.value = Date.now()
		}, 1000)
	}

	return { timer, goal, isRunning, elapsed, load, toggle, init }
})

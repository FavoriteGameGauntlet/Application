import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { TimerState } from '../../api-facade/models/timers-models'
import { StoreName } from '../../enums/storeName'
import { useApiTimerStore } from '../api/apiTimerStore'
import { useApiWheelStore } from '../api/apiWheelStore'
import { useAuthStore } from '../authStore'

export const useFeatureWheelStore = defineStore(StoreName.FeatureWheel, () => {
	const wheelStore = useApiWheelStore()
	const timerStore = useApiTimerStore()
	const authStore = useAuthStore()

	const currentEffects = computed(() => wheelStore.currentEffects)
	const availableEffects = computed(() => wheelStore.availableEffects)

	const pendingRoll = computed(() => wheelStore.pendingRoll)

	const getHistory = async (login: string | undefined = authStore.login) => {
		if (!login) return Promise.reject('No current user login')

		await wheelStore.getHistory(login)
	}

	const getAvailableEffects = () => wheelStore.getAvailableEffects()

	const roll = () => wheelStore.roll()

	const getLastRoll = () => wheelStore.getLastRoll()

	const init = () => {
		// Get available roll count on timer end
		/** @todo maybe always +1 regardless of API response? */
		watch(
			() => timerStore.state,
			(state) => {
				if (!state || state === TimerState.Finished)
					wheelStore.getAvailableCount()
			},
			{ immediate: true },
		)

		// Get count on login
		watch(
			() => authStore.isLoggedIn,
			(isLoggedIn) => isLoggedIn && wheelStore.getAvailableCount(),
			{ immediate: true },
		)
	}

	return {
		currentEffects,
		availableEffects,

		pendingRoll,

		init,

		getHistory,
		getHistoryState: wheelStore.getHistoryState,

		getAvailableEffects,
		getAvailableEffectsState: wheelStore.getAvailableEffectsState,

		roll,
		rollState: wheelStore.rollState,

		getLastRoll,
		getLastRollState: wheelStore.getLastRollState,
	}
})

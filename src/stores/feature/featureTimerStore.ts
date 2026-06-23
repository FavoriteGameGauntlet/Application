import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { StoreName } from '../../enums/storeName'
import { useApiTimerStore } from '../api/apiTimerStore'
import { useAuthStore } from '../authStore'

export const useFeatureTimerStore = defineStore(StoreName.FeatureTimer, () => {
	const timerStore = useApiTimerStore()
	const authStore = useAuthStore()
	// const gameStore = useApiGameStore()
	// const wheelStore = useApiWheelStore()

	const state = computed(() => timerStore.state)

	const durationLeft = computed(() => timerStore.durationLeft)
	const durationTotal = computed(() => timerStore.durationTotal)

	const loading = computed(
		() =>
			timerStore.toggleState.isLoading || timerStore.getCurrentState.isLoading,
	)

	const toggle = () => timerStore.toggle()

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

		// Reset timer on game change
		// watch(
		// 	{
		// 		isLoggedIn: authStore.isLoggedIn,
		// 		currentGame: authStore.login
		// 			? gameStore.current[authStore.login]
		// 			: null,
		// 	},
		// 	({ currentGame, isLoggedIn }) => {
		// 		isLoggedIn && timerStore.getCurrent()
		// 	},
		// 	{ immediate: true },
		// )
	}

	return {
		state,

		durationLeft,
		durationTotal,

		loading,

		toggle,
		/** @todo add wheelStore.pendingRoll to condition */
		canToggle: computed(() => timerStore.canToggle),

		init,
	}
})

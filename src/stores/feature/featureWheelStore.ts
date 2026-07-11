import { defineStore } from 'pinia'
import { computed } from 'vue'
import { StoreName } from '../../enums/storeName'
import { useApiUserStore } from '../api/apiUserStore'
import { useApiWheelStore } from '../api/apiWheelStore'
import { useAuthStore } from '../authStore'
import { useFeatureSystemParametersStore } from './featureSystemParametersStore'

export const useFeatureWheelStore = defineStore(StoreName.FeatureWheel, () => {
	const wheelStore = useApiWheelStore()
	const userStore = useApiUserStore()
	const authStore = useAuthStore()
	const systemParametersStore = useFeatureSystemParametersStore()

	const currentEffects = computed(() => wheelStore.currentEffects)
	const availableEffects = computed(() => wheelStore.availableEffects)

	const availableRollCount = computed(() => wheelStore.availableRollCount)
	const pendingRoll = computed(
		() =>
			wheelStore.availableRollCount >=
			systemParametersStore.minimumAvailableRollCountForRoll,
	)

	const getHistory = async (login: string | undefined = authStore.login) => {
		if (!login) return Promise.reject('No current user login')

		await wheelStore.getHistory(login)
	}

	const getAvailableEffects = () => wheelStore.getAvailableEffects()

	const roll = (isReroll: boolean = false) =>
		wheelStore.roll(
			systemParametersStore.minimumAvailableRollCountForRoll,
			systemParametersStore.availableRollChangeByRoll,
			isReroll,
		)

	const getLastRoll = () => wheelStore.getLastRoll()

	const clearLastRoll = () => wheelStore.clearLastRoll()

	const getAvailableCount = () => wheelStore.getAvailableCount()

	return {
		currentEffects,
		availableEffects,

		availableRollCount,
		pendingRoll,

		getAvailableCount,
		getAvailableCountState: wheelStore.getAvailableCountState,

		getHistory,
		getHistoryState: wheelStore.getHistoryState,

		getAvailableEffects,
		getAvailableEffectsState: wheelStore.getAvailableEffectsState,

		roll,
		rollState: wheelStore.rollState,

		getLastRoll,
		getLastRollState: wheelStore.getLastRollState,

		clearLastRoll,
		clearLastRollState: wheelStore.clearLastRollState,

		users: computed(() => userStore.users),
		getAllUsers: userStore.getAllUsers,
		getAllUsersState: userStore.getAllUsersState,

		applyRoll: wheelStore.applyRoll,
		applyRollState: wheelStore.applyRollState,
	}
})

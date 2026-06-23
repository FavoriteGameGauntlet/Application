import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../../api-facade/api'
import type {
	RolledWheelEffectHistory,
	WheelEffect,
} from '../../api-facade/models/wheel-effects-models'
import { StoreName } from '../../enums/storeName'
import type { WheelResult } from '../../types/wheelResult'
import { LoadingStatus, withLoading } from '../../utils/loadingState'

export const useApiWheelStore = defineStore(StoreName.ApiWheel, () => {
	const availableRollCount = ref(0)
	const effectsHistory = ref<
		Record<string, RolledWheelEffectHistory[] | undefined>
	>({})
	const availableEffects = ref<WheelEffect[] | null>(null)
	const currentEffects = ref<WheelResult | null>(null)

	const pendingRoll = computed(() => availableRollCount.value !== 0)

	const [getHistory, getHistoryState] = withLoading(
		async (status, login: string) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			await api.wheelEffects
				.getHistory({ path: { login } })
				.then((rolls) => {
					effectsHistory.value[login] = rolls
					status.value = LoadingStatus.LOADED
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getAvailableEffects, getAvailableEffectsState] = withLoading(
		async (status) => {
			if (availableEffects.value) return
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			await api.wheelEffects
				.getAvailable()
				.then((effects) => {
					availableEffects.value = effects
					status.value = LoadingStatus.LOADED
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [roll, rollState] = withLoading(async (status) => {
		if (!pendingRoll.value) {
			return Promise.reject('No pending rolls')
		}
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		await api.wheelEffects
			.postRoll()
			.then((effects) => {
				currentEffects.value = effects
				status.value = LoadingStatus.LOADED
			})
			.catch((e) => {
				status.value = LoadingStatus.ERROR
				throw e
			})
	})

	const [getAvailableCount, getAvailableCountState] = withLoading(
		async (status) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			await api.wheelEffects
				.getAvailableCount()
				.then((count) => {
					availableRollCount.value = count
					status.value = LoadingStatus.LOADED
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getLastRoll, getLastRollState] = withLoading(async (status) => {
		if (currentEffects.value) return currentEffects.value
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		await api.wheelEffects
			.getLastRolled()
			.then((effects) => {
				currentEffects.value = effects
				status.value = LoadingStatus.LOADED
			})
			.catch((e) => {
				status.value = LoadingStatus.ERROR
				throw e
			})
	})

	// const applyRoll = async () => {
	//  @todo remove applied from available
	// 	await api.wheelEffects.postApplyRoll()
	// }

	return {
		availableRollCount,
		effectsHistory,
		availableEffects,
		currentEffects,

		pendingRoll,

		getHistory,
		getHistoryState,

		getAvailableEffects,
		getAvailableEffectsState,

		roll,
		rollState,

		getAvailableCount,
		getAvailableCountState,

		getLastRoll,
		getLastRollState,

		// applyRoll,
		// applyRollState,
	}
})

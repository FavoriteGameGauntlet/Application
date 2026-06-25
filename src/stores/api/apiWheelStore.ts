import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import { FreePointChangeSource } from '../../api-facade/models/points-models'
import type {
	RolledWheelEffectHistory,
	WheelEffect,
} from '../../api-facade/models/wheel-effects-models'
import { StoreName } from '../../enums/storeName'
import type { WheelResult } from '../../types/wheelResult.ts'
import { LoadingStatus, withLoading } from '../../utils/loadingState'

export const useApiWheelStore = defineStore(StoreName.ApiWheel, () => {
	const availableRollCount = ref(0)
	const effectsHistory = ref<
		Record<string, RolledWheelEffectHistory[] | undefined>
	>({})
	const availableEffects = ref<WheelEffect[] | null>(null)
	const currentEffects = ref<WheelResult | null>(null)

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
		if (availableRollCount.value <= 0) {
			return Promise.reject('No pending rolls')
		}
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		await api.wheelEffects
			.postRoll()
			.then((effects) => {
				currentEffects.value = effects
				availableRollCount.value--
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

	const [applyRoll, applyRollState] = withLoading(
		async (
			status,
			effectName: string,
			changes: { login: string; desiredChangeValue: number }[],
		) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			await api.wheelEffects
				.postApplyRoll({
					body: {
						wheelEffectName: effectName,
						pointChanges: changes.map(({ login, desiredChangeValue }) => ({
							login,
							pointChange: {
								changeSource: FreePointChangeSource.WheelEffect,
								desiredChangeValue,
							},
						})),
					},
				})
				.then(() => {
					const effect = currentEffects.value?.find((e) => e.name === effectName)
					if (effect) effect.isApplied = true
					status.value = LoadingStatus.LOADED
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	return {
		availableRollCount,
		effectsHistory,
		availableEffects,
		currentEffects,

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

		applyRoll,
		applyRollState,
	}
})

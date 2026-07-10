import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import {
	PointType,
	getPointChangeResult,
} from '../../api-facade/models/points-models'
import type {
	RolledWheelEffectHistory,
	WheelEffect,
	WheelEffectPointChange,
} from '../../api-facade/models/wheel-effects-models'
import { StoreName } from '../../enums/storeName'
import type { WheelResult } from '../../types/wheelResult.ts'
import { LoadingStatus, withLoading } from '../../utils/loadingState'
import { useAuthStore } from '../authStore'
import { useApiPointsStore } from './apiPointsStore'

export const useApiWheelStore = defineStore(StoreName.ApiWheel, () => {
	const authStore = useAuthStore()
	const pointsStore = useApiPointsStore()

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

	const [roll, rollState] = withLoading(
		async (
			status,
			minimum: number,
			change: number,
			isReroll: boolean = false,
		) => {
			if (availableRollCount.value < minimum) {
				return Promise.reject(
					`Not enough available rolls (minimum: ${minimum})`,
				)
			}
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			await api.wheelEffects
				.postRoll(isReroll)
				.then((effects) => {
					currentEffects.value = effects
					if (!isReroll) availableRollCount.value += change
					status.value = LoadingStatus.LOADED
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

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

	const [clearLastRoll, clearLastRollState] = withLoading(async (status) => {
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		await api.wheelEffects
			.clearLastRolled()
			.then(() => {
				currentEffects.value = null
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
			pointChanges: WheelEffectPointChange[],
		) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			await api.wheelEffects
				.postApplyRoll({
					body: {
						wheelEffectName: effectName,
						pointChanges: pointChanges,
					},
				})
				.then((results) => {
					for (const result of results) {
						const availableRollsResult = getPointChangeResult(
							result.changeResults,
							PointType.AvailableRolls,
						)
						if (availableRollsResult && result.login === authStore.login) {
							availableRollCount.value = availableRollsResult.finalValue
						}

						const freePointsResult = getPointChangeResult(
							result.changeResults,
							PointType.FreePoints,
						)
						if (freePointsResult) {
							pointsStore.freePoints[result.login] = freePointsResult.finalValue
							if (pointsStore.pointsInfo[result.login]) {
								pointsStore.pointsInfo[result.login].freePoints =
									freePointsResult.finalValue
							}
							pointsStore.getFreePointsHistory(result.login)
						}

						const territoryPointsResult = getPointChangeResult(
							result.changeResults,
							PointType.TerritoryPoints,
						)
						if (territoryPointsResult) {
							pointsStore.territoryPoints[result.login] =
								territoryPointsResult.finalValue
							if (pointsStore.pointsInfo[result.login]) {
								pointsStore.pointsInfo[result.login].territoryPoints =
									territoryPointsResult.finalValue
							}
							pointsStore.getTerritoryPointsHistory(result.login)
						}

						const experiencePointsResult = getPointChangeResult(
							result.changeResults,
							PointType.ExperiencePoints,
						)
						if (experiencePointsResult && result.login === authStore.login) {
							pointsStore.experiencePoints = experiencePointsResult.finalValue
						}

						const territoryHoursResult = getPointChangeResult(
							result.changeResults,
							PointType.TerritoryHours,
						)
						if (territoryHoursResult && result.login === authStore.login) {
							pointsStore.territoryHours = territoryHoursResult.finalValue
						}
					}

					const effect = currentEffects.value?.find(
						(e) => e.name === effectName,
					)
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

		clearLastRoll,
		clearLastRollState,

		applyRoll,
		applyRollState,
	}
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import {
	getPointChangeResult,
	PointType,
	type FreePointChange,
	type FreePointChangeHistory,
	type PointChange,
	type PointInfo,
	type TerritoryHourChange,
	type TerritoryPointChangeHistory,
} from '../../api-facade/models/points-models'
import { StoreName } from '../../enums/storeName'
import { LoadingStatus, withLoading } from '../../utils/loadingState'
import { useAuthStore } from '../authStore'

export const useApiPointsStore = defineStore(StoreName.ApiPoints, () => {
	const authStore = useAuthStore()

	const pointsInfo = ref<Record<string, PointInfo>>({})
	const freePointsHistory = ref<Record<string, FreePointChangeHistory[]>>({})
	const territoryPointsHistory = ref<Record<string, TerritoryPointChangeHistory[]>>({})

	const experiencePoints = ref<number | null>(null)
	const territoryHours = ref<number | null>(null)
	const freePoints = ref<Record<string, number>>({})
	const territoryPoints = ref<Record<string, number>>({})

	const [getPointsInfo, getPointsInfoState] = withLoading(
		async (status, login: string) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.getPointsInfo({ path: { login } })
				.then((info) => {
					pointsInfo.value[login] = info
					status.value = LoadingStatus.LOADED

					return info
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getFreePointsHistory, getFreePointsHistoryState] = withLoading(
		async (status, login: string) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.getFreePointsHistory({ path: { login } })
				.then((history) => {
					freePointsHistory.value[login] = history
					status.value = LoadingStatus.LOADED

					return history
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getTerritoryPointsHistory, getTerritoryPointsHistoryState] = withLoading(
		async (status, login: string) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.getTerritoryPointsHistory({ path: { login } })
				.then((history) => {
					territoryPointsHistory.value[login] = history
					status.value = LoadingStatus.LOADED

					return history
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getExperiencePoints, getExperiencePointsState] = withLoading(
		async (status) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.getExperiencePoints()
				.then((value) => {
					experiencePoints.value = value
					status.value = LoadingStatus.LOADED

					return value
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getTerritoryHours, getTerritoryHoursState] = withLoading(
		async (status) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.getTerritoryHours()
				.then((value) => {
					territoryHours.value = value
					status.value = LoadingStatus.LOADED

					return value
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getFreePoints, getFreePointsState] = withLoading(
		async (status, login: string) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.getFreePoints({ path: { login } })
				.then((value) => {
					freePoints.value[login] = value
					status.value = LoadingStatus.LOADED

					return value
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getTerritoryPoints, getTerritoryPointsState] = withLoading(
		async (status, login: string) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.getTerritoryPoints({ path: { login } })
				.then((value) => {
					territoryPoints.value[login] = value
					status.value = LoadingStatus.LOADED

					return value
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [postExperiencePoints, postExperiencePointsState] = withLoading(
		async (status, change: PointChange) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.postExperiencePoints({ body: change })
				.then((result) => {
					experiencePoints.value = result.finalValue
					status.value = LoadingStatus.LOADED

					return result
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [postTerritoryHours, postTerritoryHoursState] = withLoading(
		async (status, change: TerritoryHourChange) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.postTerritoryHours({ body: change })
				.then((result) => {
					const territoryHoursResult = getPointChangeResult(
						result,
						PointType.TerritoryHours,
					)
					if (territoryHoursResult) {
						territoryHours.value = territoryHoursResult.finalValue
					}

					const territoryPointsResult = getPointChangeResult(
						result,
						PointType.TerritoryPoints,
					)
					if (territoryPointsResult) {
						const affectedLogins = [authStore.login, change.login].filter(
							(login): login is string => !!login,
						)

						for (const affectedLogin of affectedLogins) {
							api.points
								.getTerritoryPoints({ path: { login: affectedLogin } })
								.then((value) => {
									territoryPoints.value[affectedLogin] = value
								})
							api.points
								.getTerritoryPointsHistory({ path: { login: affectedLogin } })
								.then((history) => {
									territoryPointsHistory.value[affectedLogin] = history
								})
						}
					}

					status.value = LoadingStatus.LOADED

					return result
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [postTerritoryPoints, postTerritoryPointsState] = withLoading(
		async (status, login: string, change: PointChange) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.postTerritoryPoints({ body: change, path: { login } })
				.then((result) => {
					territoryPoints.value[login] = result.finalValue

					api.points
						.getTerritoryPointsHistory({ path: { login } })
						.then((history) => {
							territoryPointsHistory.value[login] = history
						})

					status.value = LoadingStatus.LOADED

					return result
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [postFreePoints, postFreePointsState] = withLoading(
		async (status, login: string, change: FreePointChange) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.postFreePoints({ body: change, path: { login } })
				.then((result) => {
					freePoints.value[login] = result.finalValue

					api.points
						.getFreePointsHistory({ path: { login } })
						.then((history) => {
							freePointsHistory.value[login] = history
						})

					status.value = LoadingStatus.LOADED

					return result
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	return {
		pointsInfo,
		freePointsHistory,
		territoryPointsHistory,

		experiencePoints,
		territoryHours,
		freePoints,
		territoryPoints,

		getPointsInfo,
		getPointsInfoState,

		getFreePointsHistory,
		getFreePointsHistoryState,

		getTerritoryPointsHistory,
		getTerritoryPointsHistoryState,

		getExperiencePoints,
		getExperiencePointsState,

		getTerritoryHours,
		getTerritoryHoursState,

		getFreePoints,
		getFreePointsState,

		getTerritoryPoints,
		getTerritoryPointsState,

		postExperiencePoints,
		postExperiencePointsState,

		postTerritoryHours,
		postTerritoryHoursState,

		postTerritoryPoints,
		postTerritoryPointsState,

		postFreePoints,
		postFreePointsState,
	}
})

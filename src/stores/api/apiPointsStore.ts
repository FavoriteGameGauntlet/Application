import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import type {
	FreePointChangeHistory,
	PointChange,
	PointInfo,
	TerritoryPointChangeHistory,
} from '../../api-facade/models/points-models'
import { StoreName } from '../../enums/storeName'
import { LoadingStatus, withLoading } from '../../utils/loadingState'

export const useApiPointsStore = defineStore(StoreName.ApiPoints, () => {
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
		async (status, change: PointChange) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.points
				.postTerritoryHours({ body: change })
				.then((result) => {
					territoryHours.value = result.finalValue
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
	}
})

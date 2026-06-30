import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import type {
	FreePointChangeHistory,
	PointInfo,
	TerritoryPointChangeHistory,
} from '../../api-facade/models/points-models'
import { StoreName } from '../../enums/storeName'
import { LoadingStatus, withLoading } from '../../utils/loadingState'

export const useApiPointsStore = defineStore(StoreName.ApiPoints, () => {
	const pointsInfo = ref<Record<string, PointInfo>>({})
	const freePointsHistory = ref<Record<string, FreePointChangeHistory[]>>({})
	const territoryPointsHistory = ref<Record<string, TerritoryPointChangeHistory[]>>({})

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

	return {
		pointsInfo,
		freePointsHistory,
		territoryPointsHistory,

		getPointsInfo,
		getPointsInfoState,

		getFreePointsHistory,
		getFreePointsHistoryState,

		getTerritoryPointsHistory,
		getTerritoryPointsHistoryState,
	}
})

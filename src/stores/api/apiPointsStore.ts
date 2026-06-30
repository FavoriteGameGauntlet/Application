import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import type { PointInfo } from '../../api-facade/models/points-models'
import { StoreName } from '../../enums/storeName'
import { LoadingStatus, withLoading } from '../../utils/loadingState'

export const useApiPointsStore = defineStore(StoreName.ApiPoints, () => {
	const pointsInfo = ref<Record<string, PointInfo>>({})

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

	return {
		pointsInfo,
		getPointsInfo,
		getPointsInfoState,
	}
})

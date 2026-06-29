import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import type { SystemParameter } from '../../api-facade/models/system-parameters-models'
import { StoreName } from '../../enums/storeName'
import { LoadingStatus, withLoading } from '../../utils/loadingState'

export const useApiSystemParametersStore = defineStore(
	StoreName.ApiSystemParameters,
	() => {
		const systemParameters = ref<SystemParameter[] | null>(null)

		const [getAllSystemParameters, getAllSystemParametersState] = withLoading(
			async (status) => {
				if (status.value === LoadingStatus.LOADING) return

				status.value = LoadingStatus.LOADING

				await api.systemParameters
					.getAllSystemParameters()
					.then((params) => {
						const missingParams = Object.keys(systemParameters).filter(
							(name) => !params.some((p) => p.name === name),
						)

						if (missingParams.length > 0)
							throw new Error(
								`Missing system parameters: ${missingParams.join(', ')}`,
							)

						systemParameters.value = params
						status.value = LoadingStatus.LOADED
					})
					.catch((error) => {
						status.value = LoadingStatus.ERROR

						throw error
					})
			},
		)

		return {
			systemParameters,

			getAllSystemParameters,
			getAllSystemParametersState,
		}
	},
)

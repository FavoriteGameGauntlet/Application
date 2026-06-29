import { defineStore } from 'pinia'
import { computed } from 'vue'
import { StoreName } from '../../enums/storeName'
import { SystemParameterName } from '../../enums/systemParameterName'
import { useApiSystemParametersStore } from '../api/apiSystemParametersStore'

export const useFeatureSystemParametersStore = defineStore(
	StoreName.FeatureSystemParameters,
	() => {
		const systemParametersStore = useApiSystemParametersStore()

		const getByName = (name: SystemParameterName) =>
			computed(
				() =>
					systemParametersStore.systemParameters?.find((p) => p.name === name)
						?.value as string,
			)

		const timerDurationInS = getByName(SystemParameterName.TimerDurationInS)
		const shouldLimitFreePoints = getByName(
			SystemParameterName.ShouldLimitFreePoints,
		)
		const freePointsMinimum = getByName(SystemParameterName.FreePointsMinimum)
		const minimumNumberOfWishlistGames = getByName(
			SystemParameterName.MinimumNumberOfWishlistGames,
		)
		const availableRollChangeByRoll = getByName(
			SystemParameterName.AvailableRollChangeByRoll,
		)
		const maximumAvailableRollCountForTimer = getByName(
			SystemParameterName.MaximumAvailableRollCountForTimer,
		)
		const minimumAvailableRollCountForRoll = getByName(
			SystemParameterName.MinimumAvailableRollCountForRoll,
		)

		const init = () => {
			systemParametersStore.getAllSystemParameters()
		}

		return {
			timerDurationInS,
			shouldLimitFreePoints,
			freePointsMinimum,
			minimumNumberOfWishlistGames,
			availableRollChangeByRoll,
			maximumAvailableRollCountForTimer,
			minimumAvailableRollCountForRoll,

			init,
		}
	},
)

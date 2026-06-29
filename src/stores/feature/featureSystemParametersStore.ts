import { defineStore } from 'pinia'
import { computed } from 'vue'
import { StoreName } from '../../enums/storeName'
import { systemParameters } from '../../constants/systemParameters'
import type { SystemParameterName, SystemParameterType } from '../../types/systemParameters'
import { useApiSystemParametersStore } from '../api/apiSystemParametersStore'

export const useFeatureSystemParametersStore = defineStore(
	StoreName.FeatureSystemParameters,
	() => {
		const systemParametersStore = useApiSystemParametersStore()

		const getByName = <K extends SystemParameterName>(name: K) =>
			computed(
				() =>
					systemParameters[name](
						systemParametersStore.systemParameters?.find((p) => p.name === name)
							?.value as string,
					) as SystemParameterType<K>,
			)

		const timerDurationInS = getByName('TimerDurationInS')
		const shouldLimitFreePoints = getByName('ShouldLimitFreePoints')
		const freePointsMinimum = getByName('FreePointsMinimum')
		const minimumNumberOfWishlistGames = getByName(
			'MinimumNumberOfWishlistGames',
		)
		const availableRollChangeByRoll = getByName('AvailableRollChangeByRoll')
		const maximumAvailableRollCountForTimer = getByName(
			'MaximumAvailableRollCountForTimer',
		)
		const minimumAvailableRollCountForRoll = getByName(
			'MinimumAvailableRollCountForRoll',
		)
		const seizePenaltyPoints = getByName('SeizePenaltyPoints')
		const availableRollChangeByTimer = getByName('AvailableRollChangeByTimer')
		const territoryHourChangeByTimer = getByName('TerritoryHourChangeByTimer')
		const experiencePointChangeByTimer = getByName(
			'ExperiencePointChangeByTimer',
		)
		const experiencePointChangeByLevelUp = getByName(
			'ExperiencePointChangeByLevelUp',
		)
		const territoryHourChangeBySeizeSlice = getByName(
			'TerritoryHourChangeBySeizeSlice',
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
			seizePenaltyPoints,
			availableRollChangeByTimer,
			territoryHourChangeByTimer,
			experiencePointChangeByTimer,
			experiencePointChangeByLevelUp,
			territoryHourChangeBySeizeSlice,

			init,
		}
	},
)

import { defineStore } from 'pinia'
import { computed } from 'vue'
import { StoreName } from '../../enums/storeName'
import { systemParameters } from '../../constants/systemParameters'
import type {
	SystemParameterName,
	SystemParameterType,
} from '../../types/systemParameters'
import { useApiSystemParametersStore } from '../api/apiSystemParametersStore'

export const useFeatureSystemParametersStore = defineStore(
	StoreName.FeatureSystemParameters,
	() => {
		const systemParametersStore = useApiSystemParametersStore()

		const getByName = <K extends SystemParameterName>(key: K) =>
			computed(() => {
				const { name, convert } = systemParameters[key]
				return convert(
					systemParametersStore.systemParameters?.find((p) => p.name === name)
						?.value as string,
				) as SystemParameterType<K>
			})

		const timerDurationInS = getByName('timerDurationInS')
		const shouldLimitFreePoints = getByName('shouldLimitFreePoints')
		const freePointsMinimum = getByName('freePointsMinimum')
		const minimumNumberOfWishlistGames = getByName(
			'minimumNumberOfWishlistGames',
		)
		const availableRollChangeByRoll = getByName('availableRollChangeByRoll')
		const maximumAvailableRollCountForTimer = getByName(
			'maximumAvailableRollCountForTimer',
		)
		const minimumAvailableRollCountForRoll = getByName(
			'minimumAvailableRollCountForRoll',
		)
		const seizePenaltyPoints = getByName('seizePenaltyPoints')
		const availableRollChangeByTimer = getByName('availableRollChangeByTimer')
		const territoryHourChangeByTimer = getByName('territoryHourChangeByTimer')
		const experiencePointChangeByTimer = getByName(
			'experiencePointChangeByTimer',
		)
		const experiencePointChangeByLevelUp = getByName(
			'experiencePointChangeByLevelUp',
		)
		const territoryHourChangeBySeizeSlice = getByName(
			'territoryHourChangeBySeizeSlice',
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

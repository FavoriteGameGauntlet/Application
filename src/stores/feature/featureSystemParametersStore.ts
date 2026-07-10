import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { StoreName } from '../../enums/storeName'
import { systemParameterDefs } from '../../constants/systemParameters'
import type {
	SystemParameterName,
	SystemParameterType,
} from '../../types/systemParameters'
import { LoadingStatus } from '../../utils/loadingState'
import { useApiSystemParametersStore } from '../api/apiSystemParametersStore'

const RETRY_DELAYS_MS = [200, 400, 800, 1600]
const LONG_RETRY_DELAY_MS = 60_000

export const useFeatureSystemParametersStore = defineStore(
	StoreName.FeatureSystemParameters,
	() => {
		const systemParametersStore = useApiSystemParametersStore()

		const retriesExhausted = ref(false)
		const nextRetryAt = ref<number | null>(null)

		const getByName = <K extends SystemParameterName>(key: K) =>
			computed(() => {
				const { name, convert } = systemParameterDefs[key]
				return convert(
					systemParametersStore.systemParameters?.find((p) => p.name === name)
						?.value as string,
				) as SystemParameterType<K>
			})

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
		const territoryPointChangeBySeizeSlice = getByName(
			'territoryPointChangeBySeizeSlice',
		)
		const freePointChangeByBaseTeleport = getByName(
			'freePointChangeByBaseTeleport',
		)
		const freePointChangeBySandstorm = getByName('freePointChangeBySandstorm')

		const init = () => {
			let retryAttempt = 0

			watch(
				() => systemParametersStore.getAllSystemParametersState.status,
				(status) => {
					if (status === LoadingStatus.LOADED) {
						retryAttempt = 0
						retriesExhausted.value = false
						nextRetryAt.value = null
						return
					}

					if (retryAttempt >= RETRY_DELAYS_MS.length) retriesExhausted.value = true

					const delay =
						retryAttempt < RETRY_DELAYS_MS.length
							? RETRY_DELAYS_MS[retryAttempt]
							: LONG_RETRY_DELAY_MS
					retryAttempt += 1

					nextRetryAt.value = Date.now() + delay
					setTimeout(() => systemParametersStore.getAllSystemParameters(), delay)
				},
			)

			systemParametersStore.getAllSystemParameters()
		}

		return {
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
			territoryPointChangeBySeizeSlice,
			freePointChangeByBaseTeleport,
			freePointChangeBySandstorm,

			init,
			getAllSystemParametersState: computed(
				() => systemParametersStore.getAllSystemParametersState,
			),
			retriesExhausted,
			nextRetryAt,
		}
	},
)

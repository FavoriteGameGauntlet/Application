import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { Login } from '../../api-facade/models/users-models'
import { StoreName } from '../../enums/storeName'
import { useApiGameStore } from '../api/apiGameStore'
import { useApiPointsStore } from '../api/apiPointsStore'
import { useApiUserStore } from '../api/apiUserStore'
import { useApiWheelStore } from '../api/apiWheelStore'
import { useAuthStore } from '../authStore'

export const useFeatureUserStore = defineStore(StoreName.FeatureUser, () => {
	const apiStore = useApiUserStore()
	const authStore = useAuthStore()
	const gameStore = useApiGameStore()
	const wheelStore = useApiWheelStore()
	const pointsStore = useApiPointsStore()

	const currentUser = computed<Partial<Login>>(() => ({
		login: authStore.login,
		displayName: apiStore.currentUserDisplayName ?? authStore.login,
	}))

	const users = computed(() => apiStore.users)

	const init = async () => {
		await apiStore.getDisplayName()
	}

	const getUserCurrentGame = (login: string) => gameStore.getCurrent(login)
	const getUserHistory = (login: string) => gameStore.getHistory(login)
	const getUserWishlist = (login: string) => gameStore.getWishlist(login)
	const getUserPoints = (login: string) => pointsStore.getPointsInfo(login)
	const getUserFreePointsHistory = (login: string) => pointsStore.getFreePointsHistory(login)
	const getUserTerritoryPointsHistory = (login: string) => pointsStore.getTerritoryPointsHistory(login)
	const getUserEffects = (login: string) => wheelStore.getHistory(login)

	return {
		currentUser,
		users,

		setDisplayState: apiStore.setDisplayNameState,
		getDisplayNameState: apiStore.getDisplayNameState,
		getAllNamesState: apiStore.getAllUsersState,

		getAllUsers: apiStore.getAllUsers,
		setDisplayName: apiStore.setDisplayName,

		init,

		userCurrentGame: gameStore.current,
		userHistory: gameStore.history,
		userWishlist: gameStore.wishlist,
		userPoints: pointsStore.pointsInfo,
		userFreePointsHistory: pointsStore.freePointsHistory,
		userTerritoryPointsHistory: pointsStore.territoryPointsHistory,
		userEffects: wheelStore.effectsHistory,

		getUserCurrentGame,
		getUserCurrentGameState: gameStore.getCurrentState,

		getUserHistory,
		getUserHistoryState: gameStore.getHistoryState,

		getUserWishlist,
		getUserWishlistState: gameStore.getWishlistState,

		getUserPoints,
		getUserPointsState: pointsStore.getPointsInfoState,

		getUserFreePointsHistory,
		getUserFreePointsHistoryState: pointsStore.getFreePointsHistoryState,

		getUserTerritoryPointsHistory,
		getUserTerritoryPointsHistoryState: pointsStore.getTerritoryPointsHistoryState,

		getUserEffects,
		getUserEffectsState: wheelStore.getHistoryState,
	}
})

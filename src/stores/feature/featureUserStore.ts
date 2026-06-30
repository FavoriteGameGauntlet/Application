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

	const getPlayerCurrentGame = (login: string) => gameStore.getCurrent(login)
	const getPlayerHistory = (login: string) => gameStore.getHistory(login)
	const getPlayerWishlist = (login: string) => gameStore.getWishlist(login)
	const getPlayerPoints = (login: string) => pointsStore.getPointsInfo(login)
	const getPlayerEffects = (login: string) => wheelStore.getHistory(login)

	return {
		currentUser,
		users,

		setDisplayState: apiStore.setDisplayNameState,
		getDisplayNameState: apiStore.getDisplayNameState,
		getAllNamesState: apiStore.getAllUsersState,

		getAllUsers: apiStore.getAllUsers,
		setDisplayName: apiStore.setDisplayName,

		init,

		playerCurrentGame: gameStore.current,
		playerHistory: gameStore.history,
		playerWishlist: gameStore.wishlist,
		playerPoints: pointsStore.pointsInfo,
		playerEffects: wheelStore.effectsHistory,

		getPlayerCurrentGame,
		getPlayerCurrentGameState: gameStore.getCurrentState,

		getPlayerHistory,
		getPlayerHistoryState: gameStore.getHistoryState,

		getPlayerWishlist,
		getPlayerWishlistState: gameStore.getWishlistState,

		getPlayerPoints,
		getPlayerPointsState: pointsStore.getPointsInfoState,

		getPlayerEffects,
		getPlayerEffectsState: wheelStore.getHistoryState,
	}
})

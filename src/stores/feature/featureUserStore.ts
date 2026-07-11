import { defineStore } from 'pinia'
import { computed } from 'vue'
import type {
	FreePointChange,
	PointChange,
	TerritoryHourChange,
} from '../../api-facade/models/points-models'
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
	const otherUsers = computed(
		() => apiStore.users?.filter((u) => u.login !== authStore.login) ?? [],
	)

	const getDisplayName = () => apiStore.getDisplayName()

	const getUserCurrentGame = (login: string) => gameStore.getCurrent(login)
	const getAllUsersCurrentGames = () => gameStore.getAllCurrent()
	const getUserHistory = (login: string) => gameStore.getHistory(login)
	const getUserWishlist = (login: string) => gameStore.getWishlist(login)
	const getUserPoints = (login: string) => pointsStore.getPointsInfo(login)
	const getAllUsersPoints = () => pointsStore.getAllPointsInfo()
	const getUserFreePointsHistory = (login: string) =>
		pointsStore.getFreePointsHistory(login)
	const getUserTerritoryPointsHistory = (login: string) =>
		pointsStore.getTerritoryPointsHistory(login)
	const getUserEffects = (login: string) => wheelStore.getHistory(login)
	const getUserExperiencePoints = () => pointsStore.getExperiencePoints()
	const getUserTerritoryHours = () => pointsStore.getTerritoryHours()
	const getUserFreePoints = (login: string) => pointsStore.getFreePoints(login)
	const userExperiencePoints = computed(() => pointsStore.experiencePoints)
	const userTerritoryHours = computed(() => pointsStore.territoryHours)
	const changeExperiencePoints = (change: PointChange) =>
		pointsStore.postExperiencePoints(change)
	const changeTerritoryHours = (change: TerritoryHourChange) =>
		pointsStore.postTerritoryHours(change)
	const changeFreePoints = (login: string, change: FreePointChange) =>
		pointsStore.postFreePoints(login, change)
	const changeTerritoryPoints = (login: string, change: PointChange) =>
		pointsStore.postTerritoryPoints(login, change)

	return {
		currentUser,
		users,
		otherUsers,

		setDisplayState: apiStore.setDisplayNameState,
		getDisplayNameState: apiStore.getDisplayNameState,
		getAllNamesState: apiStore.getAllUsersState,

		getAllUsers: apiStore.getAllUsers,
		setDisplayName: apiStore.setDisplayName,

		getDisplayName,

		userCurrentGame: gameStore.current,
		userHistory: gameStore.history,
		userWishlist: gameStore.wishlist,
		userPoints: pointsStore.pointsInfo,
		userFreePointsHistory: pointsStore.freePointsHistory,
		userTerritoryPointsHistory: pointsStore.territoryPointsHistory,
		userEffects: wheelStore.effectsHistory,

		userExperiencePoints,
		userTerritoryHours,
		userFreePoints: pointsStore.freePoints,

		getUserCurrentGame,
		getUserCurrentGameState: gameStore.getCurrentState,

		getAllUsersCurrentGames,
		getAllUsersCurrentGamesState: gameStore.getAllCurrentState,

		getUserHistory,
		getUserHistoryState: gameStore.getHistoryState,

		getUserWishlist,
		getUserWishlistState: gameStore.getWishlistState,

		getUserPoints,
		getUserPointsState: pointsStore.getPointsInfoState,

		getAllUsersPoints,
		getAllUsersPointsState: pointsStore.getAllPointsInfoState,

		getUserFreePointsHistory,
		getUserFreePointsHistoryState: pointsStore.getFreePointsHistoryState,

		getUserTerritoryPointsHistory,
		getUserTerritoryPointsHistoryState:
			pointsStore.getTerritoryPointsHistoryState,

		getUserEffects,
		getUserEffectsState: wheelStore.getHistoryState,

		getUserExperiencePoints,
		getUserExperiencePointsState: pointsStore.getExperiencePointsState,

		getUserTerritoryHours,
		getUserTerritoryHoursState: pointsStore.getTerritoryHoursState,

		getUserFreePoints,
		getUserFreePointsState: pointsStore.getFreePointsState,

		changeExperiencePoints,
		changeExperiencePointsState: pointsStore.postExperiencePointsState,

		changeTerritoryHours,
		changeTerritoryHoursState: pointsStore.postTerritoryHoursState,

		changeFreePoints,
		changeFreePointsState: pointsStore.postFreePointsState,

		changeTerritoryPoints,
		changeTerritoryPointsState: pointsStore.postTerritoryPointsState,
	}
})

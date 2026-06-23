import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import type {
	CurrentGame,
	WishlistedGame,
} from '../../api-facade/models/games-models'
import { StoreName } from '../../enums/storeName'
import { useApiGameStore } from '../api/apiGameStore'
import { useApiTimerStore } from '../api/apiTimerStore'
import { useAuthStore } from '../authStore'

export const useFeatureGameStore = defineStore(StoreName.FeatureGame, () => {
	const authStore = useAuthStore()
	const gameStore = useApiGameStore()
	const timerStore = useApiTimerStore()

	const current = computed<CurrentGame | null>({
		get: () =>
			authStore.login ? (gameStore.current[authStore.login] ?? null) : null,
		set: (game: CurrentGame | null) =>
			authStore.login ? (gameStore.current[authStore.login] = game) : null,
	})
	const wishlist = computed<WishlistedGame[]>(() =>
		authStore.login ? (gameStore.wishlist[authStore.login] ?? []) : [],
	)

	const enoughGamesInWishlist = computed(() => wishlist.value.length >= 6)
	const currentGameIsFinished = computed(() => current.value === null)

	const canRoll = computed(
		() =>
			currentGameIsFinished.value &&
			gameStore.getCurrentState.isLoaded &&
			enoughGamesInWishlist.value &&
			gameStore.getWishlistState.isLoaded,
	)

	const getWishlist = () => {
		if (!authStore.login) return Promise.reject('No current user login')

		return gameStore.getWishlist(authStore.login)
	}

	const addToWishlist = async (game: WishlistedGame) => {
		if (!authStore.login) return Promise.reject('No current user login')

		return gameStore.addToWishlist(authStore.login, game)
	}

	const roll = async (login: string | undefined = authStore.login) => {
		if (!login) return Promise.reject('No current user login')
		if (!canRoll.value) return Promise.reject('Can not roll')

		return gameStore.roll(login)
	}

	const cancel = (login: string | undefined = authStore.login) => {
		if (!login) return Promise.reject('No current user login')

		return gameStore.cancel(login)
	}

	const finish = (login: string | undefined = authStore.login) => {
		if (!login) return Promise.reject('No current user login')

		return gameStore.finish(login)
	}

	const init = () => {
		// get current game on login
		watch(
			() => authStore.login,
			(login) => login && gameStore.getCurrent(login),
			{ immediate: true },
		)

		// update timer on timer change
		watch(
			() => timerStore.durationLeft,
			(newDuration, oldDuration) => {
				const delta = oldDuration.subtract(newDuration)

				if (delta.sign === -1) return

				current.value =
					current.value !== null
						? ({
								...current.value,
								timeSpent: current.value.timeSpent.add(delta),
							} satisfies CurrentGame)
						: null
			},
		)
	}

	return {
		current,
		wishlist,

		enoughGamesInWishlist,
		currentGameIsFinished,

		canRoll,

		init,

		getCurrentState: computed(() => gameStore.getCurrentState),

		addToWishlist,
		addToWishlistState: computed(() => gameStore.addToWishlistState),

		getWishlist,
		getWishlistState: computed(() => gameStore.getWishlistState),

		roll,
		rollState: computed(() => gameStore.rollState),

		cancel,
		cancelState: computed(() => gameStore.cancelState),

		finish,
		finishState: computed(() => gameStore.finishState),
	}
})

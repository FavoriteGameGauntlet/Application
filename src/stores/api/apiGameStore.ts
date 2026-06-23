import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../../api-facade/api'
import { type HttpErrorResponse } from '../../api-facade/http'
import {
	type CurrentGame,
	type WishlistedGame,
} from '../../api-facade/models/games-models'
import { StoreName } from '../../enums/storeName'
import { LoadingStatus, withLoading } from '../../utils/loadingState'

export const useApiGameStore = defineStore(StoreName.ApiGame, () => {
	const wishlist = ref<Record<string, WishlistedGame[]>>({})

	const current = ref<Record<string, CurrentGame | null>>({})

	const [addToWishlist, addToWishlistState] = withLoading(
		async (status, login: string, game: WishlistedGame) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.games
				.postWishlist({ path: { login }, body: game })
				.then(() => {
					status.value = LoadingStatus.LOADED
					wishlist.value[login] = [...wishlist.value[login], game]
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					throw e
				})
		},
	)

	const [getWishlist, getWishlistState] = withLoading(
		async (status, login: string) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.games
				.getWishlist({ path: { login } })
				.then((games) => {
					wishlist.value[login] = games
					status.value = LoadingStatus.LOADED

					return games
				})
				.catch((e) => {
					status.value = LoadingStatus.ERROR
					wishlist.value[login] ??= []

					throw e
				})
		},
	)

	const [getCurrent, getCurrentState] = withLoading(
		async (status, login: string) => {
			if (status.value === LoadingStatus.LOADING) return

			status.value = LoadingStatus.LOADING

			return api.games
				.getCurrent({ path: { login } })
				.then((game) => {
					current.value[login] = game
					status.value = LoadingStatus.LOADED

					return current.value
				})
				.catch((error: HttpErrorResponse) => {
					if (error.status === 404) {
						current.value[login] ??= null
						status.value = LoadingStatus.LOADED

						return current.value[login]
					}

					status.value = LoadingStatus.ERROR
					throw error
				})
		},
	)

	const [roll, rollState] = withLoading(async (status, login: string) => {
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		return api.games
			.postRoll()
			.then((newGame) => {
				status.value = LoadingStatus.LOADED
				current.value[login] = newGame
				wishlist.value[login] = wishlist.value[login].filter(
					(game) => game.name !== newGame.name,
				)

				return current.value
			})
			.catch((e) => {
				status.value = LoadingStatus.ERROR
				throw e
			})
	})

	const [cancel, cancelState] = withLoading(async (status, login: string) => {
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		return api.games
			.postCancelCurrent()
			.then(() => {
				status.value = LoadingStatus.LOADED
				current.value[login] = null
			})
			.catch((e) => {
				status.value = LoadingStatus.ERROR
				throw e
			})
	})

	const [finish, finishState] = withLoading(async (status, login: string) => {
		if (status.value === LoadingStatus.LOADING) return

		status.value = LoadingStatus.LOADING

		return api.games
			.postFinishCurrent()
			.then(() => {
				status.value = LoadingStatus.LOADED
				current.value[login] = null
			})
			.catch((e) => {
				status.value = LoadingStatus.ERROR
				throw e
			})
	})

	return {
		current,
		wishlist,

		getCurrent,
		getCurrentState,

		addToWishlist,
		addToWishlistState,

		getWishlist,
		getWishlistState,

		roll,
		rollState,

		cancel,
		cancelState,

		finish,
		finishState,
	}
})

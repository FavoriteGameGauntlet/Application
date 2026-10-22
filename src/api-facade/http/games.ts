import { Temporal } from '@js-temporal/polyfill'
import type { Api, GameHistoryEntry, Login, WishlistEntry } from '../contracts'
import { type HttpErrorResponse, http } from '../http'
import { currentLogin, partyPath } from './context'

type GameHistoryEntryDto = Omit<
	GameHistoryEntry,
	'timeSpent' | 'rating' | 'reviewComment'
> & {
	/** ISO 8601 duration */
	timeSpent: string
}

type GameReviewDto = { rating: number; reviewComment?: string }

const getReview = async (gameId: number, login: Login) => {
	try {
		return (
			await http.get<{ response: GameReviewDto }>(
				`${await partyPath()}/games/${gameId}/reviews/${login}`,
			)
		).body
	} catch (e) {
		// the user has not rated the game
		if ((e as HttpErrorResponse).status === 404) return null

		throw e
	}
}

const listHistory = async (login: Login): Promise<GameHistoryEntry[]> => {
	const entries = (
		await http.get<{ response: GameHistoryEntryDto[] }>(
			`${await partyPath()}/games/users/${login}/history`,
		)
	).body

	return Promise.all(
		entries.map(async (e) => {
			const review = await getReview(e.gameId, login)

			return {
				...e,
				timeSpent: Temporal.Duration.from(e.timeSpent).total('seconds'),
				rating: review?.rating ?? null,
				reviewComment: review?.reviewComment ?? null,
			}
		}),
	)
}

export const currentGame: Pick<Api['currentGame'], 'cancel'> = {
	cancel: async () => {
		await http.post(`${await partyPath()}/games/current/actions`, {
			body: { action: 'cancel' },
		})
	},
}

export const wishlist: Api['wishlist'] = {
	list: async (login) =>
		(
			await http.get<{ response: WishlistEntry[] }>(
				`${await partyPath()}/games/users/${login}/wishlist`,
			)
		).body,

	add: async (login, name) =>
		(
			await http.post<{ response: WishlistEntry }>(
				`${await partyPath()}/games/users/${login}/wishlist`,
				{ body: { name } },
			)
		).body,

	rename: async (id, name) =>
		(
			await http.patch<{ response: WishlistEntry }>(
				`${await partyPath()}/games/users/${await currentLogin()}/wishlist/${id}`,
				{ body: { name } },
			)
		).body,

	remove: async (id) => {
		await http.delete(
			`${await partyPath()}/games/users/${await currentLogin()}/wishlist/${id}`,
		)
	},
}

export const completed: Api['completed'] = {
	list: listHistory,

	saveReview: async (gameId, review) => {
		await http.put(`${await partyPath()}/games/${gameId}/review`, { body: review })

		const game = (await listHistory(await currentLogin())).find(
			(g) => g.gameId === gameId,
		)

		if (!game) throw new Error('The game is not in the history')

		return game
	},
}

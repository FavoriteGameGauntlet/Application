import { Temporal } from '@js-temporal/polyfill'
import type { Api, GameHistoryEntry, Login, WishlistEntry } from '../contracts'
import { type HttpErrorResponse, http } from '../http'
import { currentLogin, partyPath, toSeconds } from './context'
import { latestOwnEntry } from './journal'
import { getReward } from './rewards'

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

type CurrentGameDto = {
	gameId: number
	name: string
	/** ISO 8601 duration */
	timeSpent: string
	startDate: string
}

export const currentGame: Pick<
	Api['currentGame'],
	'get' | 'complete' | 'cancel' | 'reroll'
> = {
	get: async () => {
		const [{ body: game }, completionReward] = await Promise.all([
			partyPath().then(async (path) =>
				http.get<{ response: CurrentGameDto | '' }>(
					`${path}/games/users/${await currentLogin()}/current`,
				),
			),
			getReward('game_completed'),
		])

		// 204: the user has no current game, the empty body is parsed as ''
		if (game === '') return { game: null, playedSeconds: 0, completionReward }

		return {
			game: { id: game.gameId, name: game.name },
			playedSeconds: toSeconds(game.timeSpent),
			completionReward,
		}
	},

	complete: async () => {
		const login = await currentLogin()

		await http.post(`${await partyPath()}/games/current/actions`, {
			body: { action: 'finish' },
		})

		const journalEntry = await latestOwnEntry()

		return {
			granted: journalEntry.changes.flatMap((c) =>
				c.login === login && c.resource ? [c.resource] : [],
			),
			journalEntry,
		}
	},

	cancel: async () => {
		await http.post(`${await partyPath()}/games/current/actions`, {
			body: { action: 'cancel' },
		})
	},

	reroll: async () => {
		await http.post(`${await partyPath()}/games/current/actions`, {
			body: { action: 'reroll' },
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
		await http.put(`${await partyPath()}/games/${gameId}/review`, {
			body: review,
		})

		const game = (await listHistory(await currentLogin())).find(
			(g) => g.gameId === gameId,
		)

		if (!game) throw new Error('The game is not in the history')

		return game
	},
}

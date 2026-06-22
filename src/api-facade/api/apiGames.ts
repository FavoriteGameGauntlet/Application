import { convertGameDto } from '../dto'
import { http } from '../http'
import type {
	GetGamesAllCurrent,
	GetGamesCurrent,
	GetGamesHistory,
	GetGamesWishlist,
	PostGamesRoll,
	PostGamesWishlist,
} from '../requests/games-requests'

export const apiGames = {
	postWishlist: ({ body, path: { login } }: PostGamesWishlist['request']) =>
		http.post<PostGamesWishlist>(`/games/${login}/wishlist`, { body }),

	getWishlist: ({ path: { login } }: GetGamesWishlist['request']) =>
		http
			.get<GetGamesWishlist>(`/games/${login}/wishlist`)
			.then(({ body }) => body),

	getCurrent: ({ path: { login } }: GetGamesCurrent['request']) =>
		http
			.get<GetGamesCurrent>(`/games/${login}/current`)
			.then(({ body }) => convertGameDto(body)),

	getAllCurrent: () =>
		http.get<GetGamesAllCurrent>(`/games/all/current`).then(({ body }) =>
			body.map((entry) => ({
				...entry,
				currentGame: entry.currentGame && convertGameDto(entry.currentGame),
			})),
		),

	postRoll: () =>
		http
			.post<PostGamesRoll>('/games/current/roll')
			.then(({ body }) => convertGameDto(body)),

	postFinishCurrent: () => http.post('/games/current/finish'),

	postCancelCurrent: () => http.post('/games/current/cancel'),

	getHistory: ({ path: { login } }: GetGamesHistory['request']) =>
		http
			.get<GetGamesHistory>(`/games/${login}/history`)
			.then(({ body: games }) => games.map(convertGameDto)),
}

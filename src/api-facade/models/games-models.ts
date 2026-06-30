import { type DtoStringToDate, type DtoStringToDuration } from '../dto'

export type WishlistedGame = {
	name: string
}

export enum GameState {
	Started = 'started',
	Finished = 'finished',
	Cancelled = 'cancelled',
}

export const gameStateLabel: Record<GameState, string> = {
	[GameState.Started]: 'В процессе',
	[GameState.Finished]: 'Завершена',
	[GameState.Cancelled]: 'Брошена',
}

export type CurrentGameDto = {
	name: string
	state: GameState
	/** format: Duration */
	timeSpent: string
	finishDate?: string
}

export type CurrentGame = DtoStringToDuration<
	DtoStringToDate<CurrentGameDto, 'finishDate'>,
	'timeSpent'
>

import { Temporal } from '@js-temporal/polyfill'
import type { CurrentGame, CurrentGameDto } from './models/games-models'
import type { Timer, TimerDto } from './models/timers-models'
import type {
	RolledWheelEffectHistory,
	RolledWheelEffectHistoryDto,
} from './models/wheel-effects-models'
import type {
	FreePointChangeHistory,
	FreePointChangeHistoryDto,
	TerritoryPointChangeHistory,
	TerritoryPointChangeHistoryDto,
} from './models/points-models'

export type DtoStringToDate<
	Dto extends object,
	DateFields extends keyof Dto,
> = {
	[K in keyof Dto]: K extends DateFields ? Temporal.Instant : Dto[K]
}

export type DtoStringToDuration<
	Dto extends object,
	DurationFields extends keyof Dto,
> = {
	[K in keyof Dto]: K extends DurationFields ? Temporal.Duration : Dto[K]
}

export const convertGameDto = (game: CurrentGameDto): CurrentGame => ({
	...game,
	finishDate:
		game.finishDate !== undefined
			? Temporal.Instant.from(game.finishDate)
			: undefined,
	timeSpent: Temporal.Duration.from(game.timeSpent),
})

export const convertTimerDto = (timer: TimerDto): Timer => ({
	...timer,
	duration: Temporal.Duration.from(timer.duration),
	remainingTime: Temporal.Duration.from(timer.remainingTime),
	lastActionDate:
		timer.lastActionDate !== undefined
			? Temporal.Instant.from(timer.lastActionDate)
			: undefined,
})

export const convertTerritoryPointChangeHistoryDto = (
	history: TerritoryPointChangeHistoryDto,
): TerritoryPointChangeHistory => ({
	...history,
	changeDate: Temporal.Instant.from(history.changeDate),
})

export const convertFreePointChangeHistoryDto = (
	history: FreePointChangeHistoryDto,
): FreePointChangeHistory => ({
	...history,
	changeDate: Temporal.Instant.from(history.changeDate),
})

export const convertRolledWheelEffectHistoryDto = (
	history: RolledWheelEffectHistoryDto,
): RolledWheelEffectHistory => ({
	...history,
	rollDate: Temporal.Instant.from(history.rollDate),
})


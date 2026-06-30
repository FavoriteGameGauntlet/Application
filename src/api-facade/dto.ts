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
	lastActionDate: Temporal.Instant.from(timer.lastActionDate),
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


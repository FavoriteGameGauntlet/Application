import { type DtoStringToDate, type DtoStringToDuration } from '../dto-types'

export enum TimerState {
	Created = 'created',
	Running = 'running',
	Paused = 'paused',
	Finished = 'finished',
}

export const timerStateLabel: Record<TimerState, string> = {
	[TimerState.Created]: 'создан',
	[TimerState.Running]: 'идёт',
	[TimerState.Paused]: 'пауза',
	[TimerState.Finished]: 'завершён',
}

export type TimerDto = {
	/** format: Duration */
	duration: string
	lastActionDate: string
	/** format: Duration */
	remainingTime: string
	state: TimerState
}

export type Timer = DtoStringToDate<
	DtoStringToDuration<TimerDto, 'duration' | 'remainingTime'>,
	'lastActionDate'
>

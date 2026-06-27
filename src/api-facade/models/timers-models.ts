import { type DtoStringToDate, type DtoStringToDuration } from '../dto'

export enum TimerState {
	Created = 'created',
	Running = 'running',
	Paused = 'paused',
	Finished = 'finished',
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

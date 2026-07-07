import { TimerState } from '../../../api-facade/models/timers-models'

export const timerStateLabel: Record<TimerState, string> = {
	[TimerState.Created]: 'создан',
	[TimerState.Running]: 'идёт',
	[TimerState.Paused]: 'пауза',
	[TimerState.Finished]: 'завершён',
}

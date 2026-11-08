import type { Api, Timer } from '../contracts'
import { http } from '../http'
import { partyPath, toSeconds } from './context'
import { getReward } from './rewards'

type TimerDto = {
	state: Timer['state']
	/** ISO 8601 duration */
	remainingTime: string
	/** ISO 8601 duration */
	duration: string
	lastActionDate: string
}

const toTimer = (dto: TimerDto): Timer => ({
	state: dto.state,
	remainingTime: toSeconds(dto.remainingTime),
	duration: toSeconds(dto.duration),
	lastActionDate: dto.lastActionDate,
})

export const timer: Api['timer'] = {
	reward: () => getReward('timer'),

	get: async () =>
		toTimer(
			(await http.get<{ response: TimerDto }>(`${await partyPath()}/timer`))
				.body,
		),

	start: async () =>
		toTimer(
			(
				await http.post<{ response: TimerDto }>(
					`${await partyPath()}/timer/start`,
				)
			).body,
		),

	pause: async () =>
		toTimer(
			(
				await http.post<{ response: TimerDto }>(
					`${await partyPath()}/timer/pause`,
				)
			).body,
		),
}

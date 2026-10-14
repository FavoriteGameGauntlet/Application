import type { Member, PlayerStatus } from '../api-facade/contracts'
import { formatClockShort } from './format'

export const playerStatusView: Record<
	PlayerStatus,
	{ label: string; tone: 'success' | 'neutral' | 'info' | 'danger' }
> = {
	playing: { label: 'играет', tone: 'success' },
	paused: { label: 'пауза', tone: 'neutral' },
	rolling: { label: 'крутит колесо', tone: 'info' },
	dropped: { label: 'отказ от игры', tone: 'danger' },
}

/** «идёт 00:12», «на паузе», «—» */
export const memberTimerText = (member: Member) => {
	switch (member.timer.state) {
		case 'running':
			return `идёт ${formatClockShort(member.timer.elapsed)}`
		case 'paused':
			return 'на паузе'
		default:
			return '—'
	}
}

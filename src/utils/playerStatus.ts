import type { PlayerStatus } from '../api-facade/contracts'

export const playerStatusView: Record<
	PlayerStatus,
	{ label: string; tone: 'success' | 'neutral' | 'info' | 'danger' }
> = {
	playing: { label: 'играет', tone: 'success' },
	paused: { label: 'на паузе', tone: 'neutral' },
	offline: { label: 'не в сети', tone: 'info' },
}

import type { UserStatus } from '../api-facade/contracts'

export const userStatusView: Record<
	UserStatus,
	{ label: string; tone: 'success' | 'neutral' | 'info' | 'danger' }
> = {
	playing: { label: 'играет', tone: 'success' },
	paused: { label: 'на паузе', tone: 'info' },
	offline: { label: 'не в сети', tone: 'neutral' },
}

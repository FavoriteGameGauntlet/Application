import type { ItemCondition } from '../api-facade/contracts'

export const itemConditionLabels: Record<
	ItemCondition,
	{ label: string; hint: string }
> = {
	target_not_self: {
		label: 'Не на себя',
		hint: 'Цель — не тот, кто использует',
	},
	target_online: { label: 'Цель в сети', hint: 'Все цели в сети' },
	target_offline: { label: 'Цель не в сети', hint: 'Все цели не в сети' },
	holder_not_playing: {
		label: 'Нет текущей игры',
		hint: 'У того, кто использует, нет текущей игры',
	},
}

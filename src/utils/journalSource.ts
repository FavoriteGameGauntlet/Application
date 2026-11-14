import type { HistoryEventKind, JournalSource } from '../api-facade/contracts'

/** what happened and, when there is one, the entity it happened to: two facts for two lines */
export type JournalSourceParts = { kind: string; name?: string }

/** «предмет» + «Колобок», «колесо» + «×2 золото», «исправление» alone */
export const journalSourceParts = (
	{ eventKind, name, endState }: JournalSource,
	correctsEntryId?: number,
): JournalSourceParts => {
	switch (eventKind) {
		case 'item_added':
		case 'item_uses_changed':
		case 'item_removed':
		case 'item_transferred':
			return { kind: 'предмет', name }
		case 'perk_added':
		case 'perk_uses_changed':
		case 'perk_charges_changed':
		case 'perk_removed':
			return { kind: 'перк', name }
		case 'effect_added':
		case 'effect_removed':
			return { kind: 'эффект', name }
		case 'wheel_row_applied':
			return { kind: 'колесо', name }
		case 'exchange_used':
			return { kind: 'обмен', name }
		case 'timer_created':
			return { kind: 'новый таймер' }
		case 'timer_ended':
			return { kind: 'таймер' }
		case 'game_started':
			return { kind: 'начало игры', name }
		case 'game_ended':
			return {
				kind:
					endState === 'completed'
						? 'прохождение'
						: endState === 'rerolled'
							? 'перекрут игры'
							: 'отмена игры',
				name,
			}
		case 'manual_granted':
			return {
				kind:
					correctsEntryId === undefined ? 'ручное изменение' : 'исправление',
			}
		case 'point_changed':
			return { kind: 'изменение очков' }
		default:
			// the backend adds kinds over time, an unknown one is shown as it is
			return { kind: eventKind }
	}
}

/** the event kinds the history filter offers as one source */
export type JournalSourceGroup = {
	value: string
	label: string
	kinds: HistoryEventKind[]
}

export const journalSourceGroups: JournalSourceGroup[] = [
	{
		value: 'item',
		label: 'предмет',
		kinds: [
			'item_added',
			'item_uses_changed',
			'item_removed',
			'item_transferred',
		],
	},
	{
		value: 'perk',
		label: 'перк',
		kinds: [
			'perk_added',
			'perk_uses_changed',
			'perk_charges_changed',
			'perk_removed',
		],
	},
	{
		value: 'effect',
		label: 'эффект',
		kinds: ['effect_added', 'effect_removed'],
	},
	{ value: 'wheel', label: 'колесо', kinds: ['wheel_row_applied'] },
	{ value: 'exchange', label: 'обмен', kinds: ['exchange_used'] },
	{ value: 'timer', label: 'таймер', kinds: ['timer_created', 'timer_ended'] },
	{ value: 'game', label: 'игра', kinds: ['game_started', 'game_ended'] },
	{ value: 'manual', label: 'ручное изменение', kinds: ['manual_granted'] },
]

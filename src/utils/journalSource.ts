import type { HistoryEventKind, JournalEntry } from '../api-facade/contracts'

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
		kinds: ['item_added', 'item_uses_changed', 'item_removed'],
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
	{ value: 'manual', label: 'вручную', kinds: ['manual_granted'] },
]

/** the badge «вручную» of a journal entry */
export const isManualEntry = (entry: JournalEntry) =>
	entry.source.eventKind === 'manual_granted'

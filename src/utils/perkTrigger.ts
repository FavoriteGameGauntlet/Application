import type {
	GameEndState,
	HistoryEventKind,
	PerkTrigger,
	PerkTriggerAction,
} from '../api-facade/contracts'

export const triggerActionLabels: Record<PerkTriggerAction, string> = {
	add_charge: 'Добавляет заряд',
	reset_charges: 'Сбрасывает заряды',
}

/**
 * The events a trigger can react to, grouped as the picker shows them. The
 * changes of the uses and the charges of a perk are left out: a trigger on them
 * would be fired again by the charge it adds.
 */
export const triggerEventGroups: {
	title: string
	options: { value: HistoryEventKind; label: string }[]
}[] = [
	{
		title: 'Очки',
		options: [{ value: 'point_changed', label: 'Очки изменились' }],
	},
	{
		title: 'Игры',
		options: [
			{ value: 'game_started', label: 'Игра началась' },
			{ value: 'game_ended', label: 'Игра закончилась' },
		],
	},
	{
		title: 'Таймеры',
		options: [
			{ value: 'timer_created', label: 'Таймер создан' },
			{ value: 'timer_ended', label: 'Таймер закончился' },
		],
	},
	{
		title: 'Предметы',
		options: [
			{ value: 'item_added', label: 'Получен предмет' },
			{ value: 'item_uses_changed', label: 'Использован предмет' },
			{ value: 'item_removed', label: 'Предмет удалён' },
			{ value: 'item_transferred', label: 'Предмет передан' },
			{ value: 'item_limit_reached', label: 'Предмет не поместился' },
		],
	},
	{
		title: 'Перки и эффекты',
		options: [
			{ value: 'perk_added', label: 'Получен перк' },
			{ value: 'perk_removed', label: 'Перк удалён' },
			{ value: 'effect_added', label: 'Получен эффект' },
			{ value: 'effect_removed', label: 'Эффект удалён' },
		],
	},
	{
		title: 'Другое',
		options: [
			{ value: 'exchange_used', label: 'Обмен' },
			{ value: 'wheel_row_applied', label: 'Применено колесо' },
			{ value: 'manual_granted', label: 'Ручное изменение' },
		],
	},
]

export const gameEndStateLabels: Record<GameEndState, string> = {
	completed: 'Пройдена',
	cancelled: 'Отменена',
	rerolled: 'Перекручена',
}

/** the events whose trigger can be narrowed, and what the narrowing is */
export const triggerFilterOf = (
	eventKind: HistoryEventKind,
): 'point-type' | 'end-state' | undefined =>
	eventKind === 'point_changed'
		? 'point-type'
		: eventKind === 'game_ended'
			? 'end-state'
			: undefined

const eventLabel = (eventKind: HistoryEventKind) =>
	triggerEventGroups
		.flatMap((g) => g.options)
		.find((o) => o.value === eventKind)?.label ?? eventKind

/** the event of a trigger with its narrowing, as one phrase: «Очки изменились (Билеты)» */
export const triggerEventText = (trigger: PerkTrigger) => {
	const event = eventLabel(trigger.eventKind)

	if (trigger.pointTypeId !== undefined) {
		return `${event} (${trigger.pointTypeName ?? 'удалённые очки'})`
	}

	if (trigger.gameEndState) {
		return `${event} (${gameEndStateLabels[trigger.gameEndState].toLowerCase()})`
	}

	return event
}

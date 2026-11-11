import type { ISODate, JournalSource, Seconds } from '../api-facade/contracts'

const pad = (n: number) => String(n).padStart(2, '0')

/** 5077 → «01:24:37» */
export const formatClock = (seconds: Seconds) =>
	`${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`

/** 21600 → «6 ч» */
export const formatHours = (seconds: Seconds) =>
	`${Math.floor(seconds / 3600)} ч`

/** 14700 → «4 ч 05 м» */
export const formatDuration = (seconds: Seconds) =>
	`${Math.floor(seconds / 3600)} ч ${pad(Math.floor(seconds / 60) % 60)} м`

const dayMonth = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`

/** «05.09.2026» */
export const formatDate = (iso: ISODate) => {
	const d = new Date(iso)
	return `${dayMonth(d)}.${d.getFullYear()}`
}

/** «12.09 → 07.10» */
export const formatPeriod = (start: ISODate, end: ISODate) =>
	`${dayMonth(new Date(start))} → ${dayMonth(new Date(end))}`

const startOfDay = (d: Date) =>
	new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** «сейчас», «сегодня 14:20», «вчера 22:30», «08.10 12:00» */
export const formatMoment = (iso: ISODate) => {
	const d = new Date(iso)
	const now = new Date()

	if (now.getTime() - d.getTime() < 60_000) return 'сейчас'

	const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
	const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)

	if (days === 0) return `сегодня ${time}`
	if (days === 1) return `вчера ${time}`

	return `${dayMonth(d)} ${time}`
}

/** «предмет «Колобок»», «колесо · «×2 золото»», «исправление» */
export const formatJournalSource = (
	{ eventKind, name, endState }: JournalSource,
	correctsEntryId?: number,
) => {
	switch (eventKind) {
		case 'item_added':
		case 'item_uses_changed':
		case 'item_removed':
			return `предмет «${name}»`
		case 'perk_added':
		case 'perk_uses_changed':
		case 'perk_charges_changed':
		case 'perk_removed':
			return `перк «${name}»`
		case 'effect_added':
		case 'effect_removed':
			return `эффект «${name}»`
		case 'wheel_row_applied':
			return `колесо · «${name}»`
		case 'exchange_used':
			return `обмен «${name}»`
		case 'timer_created':
			return 'новый таймер'
		case 'timer_ended':
			return 'таймер'
		case 'game_started':
			return `начало игры · ${name}`
		case 'game_ended':
			return endState === 'completed'
				? `прохождение · ${name}`
				: endState === 'rerolled'
					? `перекрут игры · ${name}`
					: `отмена игры · ${name}`
		case 'manual_granted':
			return correctsEntryId === undefined ? 'ручное изменение' : 'исправление'
		case 'point_changed':
			return 'изменение очков'
		default:
			// the backend adds kinds over time, an unknown one is shown as it is
			return eventKind
	}
}

/** 6000 → «1 ч 40 м», 79200 → «22 ч», 86400 → «24 ч»; hours at most, so no time is lost to rounding */
export const formatSpan = (seconds: Seconds) => {
	const minutes = Math.max(0, Math.round(seconds / 60))
	const hours = Math.floor(minutes / 60)
	const rest = minutes % 60

	if (hours === 0) return `${rest} м`

	return rest ? `${hours} ч ${rest} м` : `${hours} ч`
}

/** 129630 → «36 ч 30 с»; every second is kept, so `parseSpan` gives the same value back */
export const formatSpanExact = (seconds: Seconds) => {
	const total = Math.max(0, Math.round(seconds))
	const parts = [
		[Math.floor(total / 3600), 'ч'],
		[Math.floor((total % 3600) / 60), 'м'],
		[total % 60, 'с'],
	] as const
	const text = parts
		.filter(([amount]) => amount > 0)
		.map(([amount, unit]) => `${amount} ${unit}`)
		.join(' ')

	return text || '0 с'
}

/** «от 0 до 1000», «от −20», «до 100», «без границ» */
export const formatBounds = (
	minimum: number | null,
	maximum: number | null,
) => {
	if (minimum !== null && maximum !== null) return `от ${minimum} до ${maximum}`
	if (minimum !== null) return `от ${minimum}`
	if (maximum !== null) return `до ${maximum}`

	return 'без границ'
}

/** «1 ч 40 м», «22 ч», «36 ч» */
export const formatRemaining = (iso: ISODate) =>
	formatSpan((Date.parse(iso) - Date.now()) / 1000)

const SPAN_UNITS: [prefix: string, seconds: number][] = [
	['д', 86_400],
	['ч', 3_600],
	['м', 60],
	['с', 1],
]

/** the units of a length typed as a number and a unit, the largest first */
export const SPAN_STEPS: { seconds: Seconds; label: string }[] = [
	{ seconds: 86_400, label: 'День' },
	{ seconds: 3_600, label: 'Час' },
	{ seconds: 60, label: 'Минута' },
	{ seconds: 1, label: 'Секунда' },
]

/** 7200 → 2 hours, 90 → 90 seconds: the largest unit that keeps every second */
export const splitSpan = (seconds: Seconds) => {
	const step =
		SPAN_STEPS.find((s) => seconds % s.seconds === 0) ??
		SPAN_STEPS[SPAN_STEPS.length - 1]

	return { amount: seconds / step.seconds, unit: step.seconds }
}

/** «1 день», «2 ч», «1 ч 40 м» → seconds; undefined when it isn't a duration */
export const parseSpan = (text: string): Seconds | undefined => {
	const value = text.trim().toLowerCase()

	if (!/^(\d+\s*[а-я]+\s*)+$/.test(value)) return undefined

	let total = 0

	for (const [, amount, unit] of value.matchAll(/(\d+)\s*([а-я]+)/g)) {
		const seconds = SPAN_UNITS.find(([prefix]) => unit.startsWith(prefix))?.[1]

		if (seconds === undefined) return undefined

		total += Number(amount) * seconds
	}

	return total
}

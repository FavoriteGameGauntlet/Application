import { Temporal } from '@js-temporal/polyfill'
import type { ISODate } from '../api-facade/contracts'

/**
 * A day is «2026-11-01», a period is «2026-11-01/2026-11-30»: both ends belong
 * to it. Strings, because that is what a form field holds.
 */
export type Day = string

export type Period = { start: Day; end: Day }

/** the quick lengths next to a period, counted from its first day */
export const PERIOD_PRESETS: {
	key: string
	label: string
	end: (start: Day) => Day
}[] = [
	{
		key: 'month',
		label: 'Месяц',
		// Temporal refuses a duration with mixed signs, so the day is taken off apart
		end: (start) =>
			Temporal.PlainDate.from(start)
				.add({ months: 1 })
				.subtract({ days: 1 })
				.toString(),
	},
	{
		key: 'fortnight',
		label: '2 недели',
		end: (start) => Temporal.PlainDate.from(start).add({ days: 13 }).toString(),
	},
	{
		key: 'week',
		label: 'Неделя',
		end: (start) => Temporal.PlainDate.from(start).add({ days: 6 }).toString(),
	},
]

export const today = (): Day => Temporal.Now.plainDateISO().toString()

export const joinPeriod = ({ start, end }: Period) => `${start}/${end}`

/** undefined when the text is not a period */
export const splitPeriod = (value: string): Period | undefined => {
	const [start, end] = value.split('/')

	if (!start || !end) return undefined

	try {
		Temporal.PlainDate.from(start)
		Temporal.PlainDate.from(end)
	} catch {
		return undefined
	}

	return { start, end }
}

/** the days of the period, both ends counted */
export const countDays = ({ start, end }: Period) =>
	Temporal.PlainDate.from(start).until(Temporal.PlainDate.from(end), {
		largestUnit: 'days',
	}).days + 1

export const compareDays = (a: Day, b: Day) => Temporal.PlainDate.compare(a, b)

/** the day in the local time zone that a moment of the backend falls on */
export const dayOf = (iso: ISODate): Day =>
	Temporal.Instant.from(iso)
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toPlainDate()
		.toString()

/** the first moment of the day in the local time zone */
export const startOfDayIso = (day: Day): ISODate =>
	Temporal.PlainDate.from(day)
		.toZonedDateTime(Temporal.Now.timeZoneId())
		.toInstant()
		.toString()

/** the last second of the day in the local time zone: the period includes its last day */
export const endOfDayIso = (day: Day): ISODate =>
	Temporal.PlainDate.from(day)
		.toZonedDateTime({
			timeZone: Temporal.Now.timeZoneId(),
			plainTime: '23:59:59',
		})
		.toInstant()
		.toString()

/** «1 ноября» */
export const formatDay = (day: Day) =>
	Temporal.PlainDate.from(day).toLocaleString('ru-RU', {
		day: 'numeric',
		month: 'long',
	})

/** «Ноябрь 2026» */
export const formatMonth = (month: Day) => {
	const date = Temporal.PlainDate.from(month)
	const name = date.toLocaleString('ru-RU', { month: 'long' })

	return `${name[0].toUpperCase()}${name.slice(1)} ${date.year}`
}

/** the first day of the month that holds the day, moved by `by` months */
export const shiftMonth = (day: Day, by: number): Day =>
	Temporal.PlainDate.from(day).with({ day: 1 }).add({ months: by }).toString()

/** the weeks of the month starting from Monday; a day outside the month is undefined */
export const monthWeeks = (month: Day): (Day | undefined)[][] => {
	const first = Temporal.PlainDate.from(month).with({ day: 1 })
	const lead = first.dayOfWeek - 1
	const cells: (Day | undefined)[] = [
		...Array.from({ length: lead }, () => undefined),
		...Array.from({ length: first.daysInMonth }, (_, i) =>
			first.add({ days: i }).toString(),
		),
	]

	while (cells.length % 7) cells.push(undefined)

	return Array.from({ length: cells.length / 7 }, (_, i) =>
		cells.slice(i * 7, i * 7 + 7),
	)
}

/** the day number for the cell of the calendar */
export const dayNumber = (day: Day) => Temporal.PlainDate.from(day).day

/** «4 нояб», «2 мая»: the short month without its dot, as in a table */
export const formatShortDay = (day: Day) =>
	Temporal.PlainDate.from(day)
		.toLocaleString('ru-RU', { day: 'numeric', month: 'short' })
		.replace(/\.$/, '')

/** the days from the first to the last, 0 for the same day */
export const daysBetween = ({ start, end }: Period) =>
	Temporal.PlainDate.from(start).until(Temporal.PlainDate.from(end), {
		largestUnit: 'days',
	}).days

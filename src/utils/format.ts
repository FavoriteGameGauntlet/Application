import type { ISODate, Seconds } from '../api-facade/contracts'
import { plural } from './plural'

const pad = (n: number) => String(n).padStart(2, '0')

/** 5077 → «01:24:37» */
export const formatClock = (seconds: Seconds) =>
	`${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`

/** 5077 → «01:24» */
export const formatClockShort = (seconds: Seconds) =>
	`${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}`

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

/** «1 ч 40 м», «22 ч», «1 день» */
export const formatRemaining = (iso: ISODate) => {
	const minutes = Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 60_000))
	const days = Math.floor(minutes / 1440)

	if (days >= 1) return `${days} ${plural(days, ['день', 'дня', 'дней'])}`

	const hours = Math.floor(minutes / 60)
	const rest = minutes % 60

	if (hours === 0) return `${rest} м`

	return rest ? `${hours} ч ${rest} м` : `${hours} ч`
}

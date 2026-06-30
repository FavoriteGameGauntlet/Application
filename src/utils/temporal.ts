import { Temporal } from '@js-temporal/polyfill'

export const formatInstant = (instant: Temporal.Instant): string => {
	const tz = Temporal.Now.timeZoneId()
	const dt = instant.toZonedDateTimeISO(tz)
	const pad = (n: number) => n.toString().padStart(2, '0')
	return `${dt.year}-${pad(dt.month)}-${pad(dt.day)} ${pad(dt.hour)}:${pad(dt.minute)}`
}

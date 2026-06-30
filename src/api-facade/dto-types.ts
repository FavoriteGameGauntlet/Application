import type { Temporal } from '@js-temporal/polyfill'

export type DtoStringToDate<
	Dto extends object,
	DateFields extends keyof Dto,
> = {
	[K in keyof Dto]: K extends DateFields ? Temporal.Instant : Dto[K]
}

export type DtoStringToDuration<
	Dto extends object,
	DurationFields extends keyof Dto,
> = {
	[K in keyof Dto]: K extends DurationFields ? Temporal.Duration : Dto[K]
}

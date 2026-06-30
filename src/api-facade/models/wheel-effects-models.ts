import { type DtoStringToDate } from '../dto-types'

export type WheelEffect = {
	name: string
	description?: string
}

export type RolledWheelEffectHistoryDto = WheelEffect & {
	rollDate: string
}

export type RolledWheelEffectHistory = DtoStringToDate<
	RolledWheelEffectHistoryDto,
	'rollDate'
>

export type RolledWheelEffectDto = WheelEffect & {
	isApplied: boolean
	position: number
}

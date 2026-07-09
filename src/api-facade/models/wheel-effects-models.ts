import { type DtoStringToDate } from '../dto-types'
import type { PointChange, PointChangeResults } from './points-models'

export type WheelEffect = {
	name: string
	description?: string
}

export type WheelEffectPointChange = {
	login: string
	freePointChange?: PointChange
	availableRollChange?: PointChange
}

export type WheelEffectPointChangeResult = {
	login: string
	changeResults: PointChangeResults
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

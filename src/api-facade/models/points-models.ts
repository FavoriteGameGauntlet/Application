import type { DtoStringToDate } from '../dto.ts'

export type PointInfo = {
	availableRolls: number
	experiencePoints: number
	freePoints: number
	territoryHours: number
	territoryPoints: number
}

export type PointChange = {
	changeSource: string
	desiredChangeValue: number
}

export type PointChangeResult = PointChange & {
	actualChangeValue: number
	finalValue: number
}

export type PointChangeWithLogin = {
	login: string
	pointChange: PointChange
}

export enum TerritoryChangeSource {
	ObtainingTerritory = 'territory-obtaining',
	LosingTerritory = 'territory-loss',
	Other = 'other',
}

export type TerritoryPointChangeResult = PointChangeResult & {
	changeSource: TerritoryChangeSource
}

export type TerritoryPointChangeHistoryDto = TerritoryPointChangeResult & {
	changeDate: string
	sourceLogin?: string
}

export type TerritoryPointChangeHistory = DtoStringToDate<
	TerritoryPointChangeHistoryDto,
	'changeDate'
>

export enum FreePointChangeSource {
	WheelEffect = 'wheel-effect',
	Quest = 'quest',
	BaseTeleport = 'base-teleport',
	Sandstorm = 'sandstorm',
	Other = 'other',
}

export type FreePointChange = PointChange & {
	wheelEffectName?: string
}

export type FreePointChangeResult = PointChangeResult & {
	changeSource: FreePointChangeSource
}

export type FreePointChangeHistoryDto = FreePointChangeResult & {
	changeDate: string
	sourceLogin?: string
	wheelEffectName?: string
}

export type FreePointChangeHistory = DtoStringToDate<
	FreePointChangeHistoryDto,
	'changeDate'
>

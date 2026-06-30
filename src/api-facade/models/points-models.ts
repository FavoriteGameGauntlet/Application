import type { DtoStringToDate } from '../dto-types'

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

export const territoryChangeSourceLabel: Record<TerritoryChangeSource, string> = {
	[TerritoryChangeSource.ObtainingTerritory]: 'Получение территории',
	[TerritoryChangeSource.LosingTerritory]: 'Потеря территории',
	[TerritoryChangeSource.Other]: 'Другое',
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

export const freePointChangeSourceLabel: Record<FreePointChangeSource, string> = {
	[FreePointChangeSource.WheelEffect]: 'Эффект колеса',
	[FreePointChangeSource.Quest]: 'Квест',
	[FreePointChangeSource.BaseTeleport]: 'Телепорт базы',
	[FreePointChangeSource.Sandstorm]: 'Песчаная буря',
	[FreePointChangeSource.Other]: 'Другое',
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

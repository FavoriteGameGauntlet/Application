import type { WheelResult } from '../../types/wheelResult.ts'
import type {
	FreePointChangeResult,
	PointChangeWithLogin,
} from '../models/points-models'
import type {
	RolledWheelEffectDto,
	RolledWheelEffectHistoryDto,
	WheelEffect,
} from '../models/wheel-effects-models'

export type GetWheelEffectsHistory = {
	request: {
		path: {
			login: string
		}
	}
	response: RolledWheelEffectHistoryDto[]
}

export type GetWheelEffectsAvailable = {
	response: WheelEffect[]
}

export type PostRollWheelEffect = {
	response: RolledWheelEffectDto[]
}

export type GetAvailableWheelEffectCount = {
	response: number
}

export type GetLastRolledWheelEffects = {
	response: WheelResult
}

export type PostApplyWheelEffectRoll = {
	request: {
		body: {
			pointChanges: PointChangeWithLogin[]
			wheelEffectName: string
		}
	}
	response: {
		login: string
		changeResult: FreePointChangeResult
	}[]
}

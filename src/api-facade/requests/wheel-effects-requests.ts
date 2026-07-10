import type { WheelResult } from '../../types/wheelResult.ts'
import type {
	RolledWheelEffectDto,
	RolledWheelEffectHistoryDto,
	WheelEffect,
	WheelEffectPointChange,
	WheelEffectPointChangeResult,
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
	request: {
		body: {
			isReroll: boolean
		}
	}
	response: RolledWheelEffectDto[]
}

export type GetAvailableWheelEffectCount = {
	response: number
}

export type GetLastRolledWheelEffects = {
	response: WheelResult
}

export type PostClearLastRolledWheelEffects = {
	response: void
}

export type PostApplyWheelEffectRoll = {
	request: {
		body: {
			pointChanges: WheelEffectPointChange[]
			wheelEffectName: string
		}
	}
	response: WheelEffectPointChangeResult[]
}

import type { WheelResultDto } from '../../types/wheelResult'
import type {
	FreePointChangeResult,
	PointChange,
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
	response: WheelResultDto
}

export type PostApplyWheelEffectRoll = {
	request: {
		body: {
			pointChanges: {
				login: string
				pointChange: PointChange
			}[]
			wheelEffectName: string
		}
	}
	response: {
		login: string
		changeResult: FreePointChangeResult
	}[]
}

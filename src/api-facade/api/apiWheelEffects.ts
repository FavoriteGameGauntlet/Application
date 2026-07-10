import type { WheelResult } from '../../types/wheelResult.ts'
import { convertRolledWheelEffectHistoryDto } from '../dto'
import { http } from '../http'
import type {
	GetAvailableWheelEffectCount,
	GetLastRolledWheelEffects,
	GetWheelEffectsAvailable,
	GetWheelEffectsHistory,
	PostApplyWheelEffectRoll,
	PostClearLastRolledWheelEffects,
	PostRollWheelEffect,
} from '../requests/wheel-effects-requests'

export const apiWheelEffects = {
	getHistory: ({ path: { login } }: GetWheelEffectsHistory['request']) =>
		http
			.get<GetWheelEffectsHistory>(`/wheel-effects/${login}/history`)
			.then(({ body: effects }) =>
				effects.map(convertRolledWheelEffectHistoryDto),
			),

	getAvailable: () =>
		http
			.get<GetWheelEffectsAvailable>('/wheel-effects/available')
			.then(({ body }) => body),

	postRoll: (isReroll: boolean): Promise<WheelResult> =>
		http
			.post<PostRollWheelEffect>('/wheel-effects/available/roll', {
				body: { isReroll },
			})
			.then(({ body }) => body as WheelResult),

	getAvailableCount: () =>
		http
			.get<GetAvailableWheelEffectCount>('/wheel-effects/available/roll/count')
			.then(({ body }) => body),

	getLastRolled: (): Promise<WheelResult> =>
		http
			.get<GetLastRolledWheelEffects>('/wheel-effects/available/roll/last')
			.then(({ body }) => body as WheelResult),

	clearLastRolled: () =>
		http
			.post<PostClearLastRolledWheelEffects>(
				'/wheel-effects/available/roll/last/clear',
			)
			.then(() => undefined),

	postApplyRoll: ({ body }: PostApplyWheelEffectRoll['request']) =>
		http
			.post<PostApplyWheelEffectRoll>('/wheel-effects/available/roll/apply', {
				body,
			})
			.then(({ body }) => body),
}

import type { Ref } from 'vue'
import type { HttpErrorResponse } from '../../../api-facade/http'
import {
	ExperienceChangeSource,
	experienceChangeSourceLabel,
	FreePointChangeSource,
	freePointChangeSourceLabel,
	TerritoryChangeSource,
	territoryChangeSourceLabel,
	TerritoryHourChangeSource,
	territoryHourChangeSourceLabel,
} from '../../../api-facade/models/points-models'
import { useAuthStore } from '../../../stores/authStore'
import { useFeatureSystemParametersStore } from '../../../stores/feature/featureSystemParametersStore'
import { useFeatureUserStore } from '../../../stores/feature/featureUserStore'

export type PointsChangeTarget = {
	checkboxLabel: string
	options: () => { login: string; label: string }[]
	onToggle?: (checked: boolean) => void
}

export type PointsChangeReasonOption = {
	value: string
	label: string
	// Predetermined choices shown as a dropdown, e.g. seize-slice amounts.
	sliceValues?: (applyTarget: boolean) => number[]
	// A single predetermined amount, e.g. a system-configured teleport bonus.
	fixedValue?: () => number | null
	// Lets the change be attributed to another player instead of the current user.
	target?: PointsChangeTarget
	// Shown under the reason select when this option is picked.
	warning?: string
}

const otherReasonWarning =
	'Использовать только в крайнем случае, если нужно исправить ошибку.'

export type PointsChangeSubmitPayload = {
	reason: string
	desiredChangeValue: number
	isSomeones: boolean
	targetLogin: string | null
}

export type PointsChangeConfig = {
	title: string
	reasons: PointsChangeReasonOption[]
	isLoading: () => boolean
	submit: (payload: PointsChangeSubmitPayload) => Promise<unknown> | null
	mapError?: (
		error: HttpErrorResponse,
		payload: PointsChangeSubmitPayload,
	) => string | undefined
}

// When set (e.g. on another player's profile page), points are changed for
// that player instead of the current user, and no "someone else's" picker is shown.
export const usePointsChangeConfigs = (targetLogin?: Ref<string | undefined>) => {
	const authStore = useAuthStore()
	const userStore = useFeatureUserStore()
	const systemParametersStore = useFeatureSystemParametersStore()

	const resolveLogin = () => targetLogin?.value ?? authStore.login

	const territoryPoints: PointsChangeConfig = {
		title: 'Изменить очки территорий',
		reasons: [
			{
				value: TerritoryChangeSource.ObtainingTerritory,
				label: territoryChangeSourceLabel[TerritoryChangeSource.ObtainingTerritory],
				sliceValues: () => systemParametersStore.territoryPointChangeBySeizeSlice,
			},
			{
				value: TerritoryChangeSource.LosingTerritory,
				label: territoryChangeSourceLabel[TerritoryChangeSource.LosingTerritory],
				sliceValues: () =>
					systemParametersStore.territoryPointChangeBySeizeSlice.map((v) => -v),
			},
			{
				value: TerritoryChangeSource.Other,
				label: territoryChangeSourceLabel[TerritoryChangeSource.Other],
				warning: otherReasonWarning,
			},
		],
		isLoading: () => userStore.changeTerritoryPointsState.isLoading,
		submit: ({ reason, desiredChangeValue }) => {
			const login = resolveLogin()
			if (!login) return null
			return userStore.changeTerritoryPoints(login, {
				changeSource: reason,
				desiredChangeValue,
			})
		},
	}

	const freePoints: PointsChangeConfig = {
		title: 'Изменить свободные очки',
		reasons: [
			{
				value: FreePointChangeSource.Quest,
				label: freePointChangeSourceLabel[FreePointChangeSource.Quest],
			},
			{
				value: FreePointChangeSource.BaseTeleport,
				label: freePointChangeSourceLabel[FreePointChangeSource.BaseTeleport],
				fixedValue: () => systemParametersStore.freePointChangeByBaseTeleport,
			},
			{
				value: FreePointChangeSource.Sandstorm,
				label: freePointChangeSourceLabel[FreePointChangeSource.Sandstorm],
				fixedValue: () => systemParametersStore.freePointChangeBySandstorm,
			},
			{
				value: FreePointChangeSource.Other,
				label: freePointChangeSourceLabel[FreePointChangeSource.Other],
				warning: otherReasonWarning,
			},
		],
		isLoading: () => userStore.changeFreePointsState.isLoading,
		submit: ({ reason, desiredChangeValue }) => {
			const login = resolveLogin()
			if (!login) return null
			return userStore.changeFreePoints(login, {
				changeSource: reason,
				desiredChangeValue,
			})
		},
	}

	const experiencePoints: PointsChangeConfig = {
		title: 'Изменить очки опыта',
		reasons: [
			{
				value: ExperienceChangeSource.LevelUp,
				label: experienceChangeSourceLabel[ExperienceChangeSource.LevelUp],
				fixedValue: () => systemParametersStore.experiencePointChangeByLevelUp,
			},
			{
				value: ExperienceChangeSource.Other,
				label: experienceChangeSourceLabel[ExperienceChangeSource.Other],
				warning: otherReasonWarning,
			},
		],
		isLoading: () => userStore.changeExperiencePointsState.isLoading,
		submit: ({ reason, desiredChangeValue }) =>
			userStore.changeExperiencePoints({ changeSource: reason, desiredChangeValue }),
	}

	const territoryHours: PointsChangeConfig = {
		title: 'Изменить часы территории',
		reasons: [
			{
				value: TerritoryHourChangeSource.Seize,
				label: territoryHourChangeSourceLabel[TerritoryHourChangeSource.Seize],
				sliceValues: (applyPenalty) =>
					systemParametersStore.territoryHourChangeBySeizeSlice.map((value) =>
						applyPenalty ? value + systemParametersStore.seizePenaltyPoints : value,
					),
				target: {
					checkboxLabel: 'Чужая территория',
					options: () =>
						userStore.otherUsers.map((user) => ({
							login: user.login,
							label: user.displayName ?? user.login,
						})),
					onToggle: (checked) => {
						if (checked && !userStore.users) userStore.getAllUsers()
					},
				},
			},
			{
				value: TerritoryHourChangeSource.Other,
				label: territoryHourChangeSourceLabel[TerritoryHourChangeSource.Other],
				warning: otherReasonWarning,
			},
		],
		isLoading: () => userStore.changeTerritoryHoursState.isLoading,
		submit: ({ reason, desiredChangeValue, isSomeones, targetLogin }) =>
			userStore.changeTerritoryHours({
				changeSource: reason,
				desiredChangeValue,
				isSomeones,
				...(isSomeones && targetLogin ? { login: targetLogin } : {}),
			}),
		mapError: (error, payload) =>
			error.body?.code === 'NOT_ENOUGH_CURRENT_POINTS'
				? payload.isSomeones
					? 'У выбранного игрока недостаточно очков территорий.'
					: 'У вас Недостаточно очков территорий.'
				: undefined,
	}

	return { territoryPoints, freePoints, experiencePoints, territoryHours }
}

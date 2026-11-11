import type { CatalogEntry, PointType, ResourceKind } from '../contracts'
import { http } from '../http'
import {
	type NamedItemEntryDto,
	type NamedPointModifierDto,
	toItemEntryText,
	toModifierText,
} from './changeEntry'
import { getMembers, partyPath, toSeconds } from './context'
import { toItemEntryRow, toModifierRow } from './rows'

export type ItemDto = {
	id: number
	name: string
	description: string
	usesMax: number
	shouldApplyToAll: boolean
	entries: NamedItemEntryDto[]
	conditions: NonNullable<CatalogEntry['conditions']>
}

export type EffectDto = {
	id: number
	name: string
	description: string
	/** ISO 8601 duration, left out for an effect that does not run out */
	duration?: string
	modifiers: NamedPointModifierDto[]
}

export type PerkDto = {
	id: number
	name: string
	description: string
	modifiers: NamedPointModifierDto[]
	/** left out for a perk that is only a passive one */
	ability?: {
		shouldApplyToAll: boolean
		entries: NamedItemEntryDto[]
		uses?: { max: number; start: number }
		chargesMax: number
		/** ISO 8601 duration */
		renewalPeriod?: string
	}
}

export type CatalogDto = { items: ItemDto; perks: PerkDto; effects: EffectDto }

/** the key of an owned resource in the backend answer: «itemId» of a copy, «perkId», «effectId» */
const ownedIdKey = {
	items: 'itemId',
	perks: 'perkId',
	effects: 'effectId',
} as const

export const toCatalogEntry = <K extends ResourceKind>(
	kind: K,
	dto: CatalogDto[K],
	pointTypes: PointType[],
): CatalogEntry => {
	const base = {
		id: dto.id,
		name: dto.name,
		description: dto.description,
		deleted: false,
	}

	switch (kind) {
		case 'items': {
			const item = dto as ItemDto

			return {
				...base,
				changes: item.entries.map((e) => toItemEntryText(e, pointTypes)),
				entries: item.entries.map(toItemEntryRow),
				shouldApplyToAll: item.shouldApplyToAll,
				conditions: item.conditions,
				usesMax: item.usesMax,
			}
		}
		case 'perks': {
			const perk = dto as PerkDto
			const { ability } = perk

			return {
				...base,
				changes: [
					...perk.modifiers.map((m) => toModifierText(m, pointTypes)),
					...(ability?.entries ?? []).map((e) =>
						toItemEntryText(e, pointTypes),
					),
				],
				modifiers: perk.modifiers.map(toModifierRow),
				perkKind: ability ? 'active' : 'passive',
				...(ability && {
					ability: {
						shouldApplyToAll: ability.shouldApplyToAll,
						entries: ability.entries.map(toItemEntryRow),
						...(ability.uses && { uses: ability.uses }),
						chargesMax: ability.chargesMax,
						...(ability.renewalPeriod && {
							renewalPeriod: toSeconds(ability.renewalPeriod),
						}),
					},
				}),
				...(ability?.uses && { usesMax: ability.uses.max }),
			}
		}
		case 'effects': {
			const effect = dto as EffectDto

			return {
				...base,
				changes: effect.modifiers.map((m) => toModifierText(m, pointTypes)),
				modifiers: effect.modifiers.map(toModifierRow),
				duration: effect.duration ? toSeconds(effect.duration) : null,
			}
		}
	}

	throw new Error(`Unknown catalog kind: ${String(kind)}`)
}

export const toPointTypeEntry = (type: PointType): CatalogEntry => ({
	id: type.id,
	name: type.name,
	description: type.description,
	deleted: false,
	unitForms: type.unitForms,
	startValue: type.startValue,
	isPublic: type.isPublic,
	isShared: type.isShared,
	minimum: type.minimum,
	maximum: type.maximum,
})

/** how many copies (items) or holders (perks, effects) of each catalogue entry the users have */
export const countHolders = async (kind: ResourceKind) => {
	const path = await partyPath()
	const owned = await Promise.all(
		(await getMembers()).map(
			async ({ login }) =>
				(
					await http.get<{ response: Record<string, number>[] }>(
						`${path}/${kind}/${login}`,
					)
				).body,
		),
	)
	const counts = new Map<number, number>()

	for (const entry of owned.flat()) {
		const id = entry[ownedIdKey[kind]]

		counts.set(id, (counts.get(id) ?? 0) + 1)
	}

	return counts
}

/** the total of each point type over the users, and the value of the shared ones */
export const countPointHolders = async () => {
	const path = await partyPath()
	const [users, party] = await Promise.all([
		http.get<{
			response: { points: { pointType: PointType; value: number }[] }[]
		}>(`${path}/points/users`),
		http.get<{ response: { pointType: PointType; value: number }[] }>(
			`${path}/points/party`,
		),
	])
	const totals = new Map<number, number>()

	for (const { pointType, value } of [
		...users.body.flatMap((u) => u.points),
		...party.body,
	]) {
		totals.set(pointType.id, (totals.get(pointType.id) ?? 0) + value)
	}

	return totals
}

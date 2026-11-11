import type { PointType, ResourceRef } from '../contracts'
import { formatResource } from '../../utils/formatResource'

/** NamedChangeEntry: exactly one target is set, the name is left out when the target is gone */
export type NamedChangeEntryDto = {
	/** names the entry in the `entryIds` of a use */
	entryId?: number
	pointTypeId?: number | null
	pointTypeName?: string | null
	itemId?: number | null
	itemName?: string | null
	perkId?: number | null
	perkName?: string | null
	effectId?: number | null
	effectName?: string | null
	amount: number
}

/** the backend keeps a cost negative, the client shows the amount without the sign */
export const toResourceRef = (entry: NamedChangeEntryDto): ResourceRef => {
	const amount = Math.abs(entry.amount)
	const entryId = entry.entryId === undefined ? {} : { entryId: entry.entryId }

	if (entry.pointTypeId != null) {
		return {
			kind: 'points',
			id: entry.pointTypeId,
			name: entry.pointTypeName ?? '',
			amount,
			...entryId,
		}
	}

	if (entry.itemId != null) {
		return {
			kind: 'item',
			id: entry.itemId,
			name: entry.itemName ?? '',
			amount,
			...entryId,
		}
	}

	if (entry.perkId != null) {
		return {
			kind: 'perk',
			id: entry.perkId,
			name: entry.perkName ?? '',
			...entryId,
		}
	}

	if (entry.effectId != null) {
		return {
			kind: 'effect',
			id: entry.effectId,
			name: entry.effectName ?? '',
			...entryId,
		}
	}

	throw new Error('A change entry has no target')
}

/** NamedItemEntry: a NamedChangeEntry that also says whom it acts on */
export type NamedItemEntryDto = NamedChangeEntryDto & {
	/** the copies the entry acts on are picked when the item is used */
	userItem: boolean
	target: 'self' | 'chosen'
}

export const entryName = (entry: NamedChangeEntryDto) =>
	entry.pointTypeName ??
	entry.itemName ??
	entry.perkName ??
	entry.effectName ??
	''

export const signOf = (amount: number) => (amount < 0 ? '−' : '+')

/** «+50», «−1» */
export const signedAmount = (amount: number) =>
	`${signOf(amount)}${Math.abs(amount)}`

/** «+50 золота», «−Щит ×2», «+перк Коллекционер» */
export const toChangeText = (
	entry: NamedChangeEntryDto,
	pointTypes: PointType[],
) =>
	`${signOf(entry.amount)}${formatResource(toResourceRef(entry), pointTypes)}`

/** an entry of an item or of a perk ability, which may act on the chosen users */
export const toItemEntryText = (
	entry: NamedItemEntryDto,
	pointTypes: PointType[],
) => {
	const text = entry.userItem
		? `${signOf(entry.amount)}выбранный предмет${Math.abs(entry.amount) > 1 ? ` ×${Math.abs(entry.amount)}` : ''}`
		: toChangeText(entry, pointTypes)

	return entry.target === 'chosen' ? `${text} (выбранным игрокам)` : text
}

/** PointModifier: a point change an effect or a perk applies while it is active */
export type NamedPointModifierDto = {
	pointTypeId: number
	pointTypeName?: string | null
	amount: number
}

export const toModifierText = (
	modifier: NamedPointModifierDto,
	pointTypes: PointType[],
) =>
	toChangeText(
		{
			pointTypeId: modifier.pointTypeId,
			pointTypeName: modifier.pointTypeName,
			amount: modifier.amount,
		},
		pointTypes,
	)

import type { ResourceRef } from '../contracts'

/** NamedChangeEntry: exactly one target is set, the name is left out when the target is gone */
export type NamedChangeEntryDto = {
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

	if (entry.pointTypeId != null) {
		return {
			kind: 'points',
			id: entry.pointTypeId,
			name: entry.pointTypeName ?? '',
			amount,
		}
	}

	if (entry.itemId != null) {
		return { kind: 'item', id: entry.itemId, name: entry.itemName ?? '', amount }
	}

	if (entry.perkId != null) {
		return { kind: 'perk', id: entry.perkId, name: entry.perkName ?? '' }
	}

	if (entry.effectId != null) {
		return { kind: 'effect', id: entry.effectId, name: entry.effectName ?? '' }
	}

	throw new Error('A change entry has no target')
}

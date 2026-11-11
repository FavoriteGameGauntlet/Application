import type {
	ChangeRow,
	ItemEntryRow,
	PointModifierRow,
	SpinCostRow,
} from '../contracts'
import type {
	NamedChangeEntryDto,
	NamedItemEntryDto,
	NamedPointModifierDto,
} from './changeEntry'

/** ChangeEntry of the backend: exactly one target id is set */
export type ChangeEntryDto = {
	pointTypeId?: number
	itemId?: number
	perkId?: number
	effectId?: number
	amount: number
}

/** what an item entry names: a catalogue target, or the copies picked at the use (taken, copied or moved) */
export type ItemEntryKindDto = 'catalog' | 'user_item' | 'user_item_transfer'

/** ItemEntry: a change entry that also says whom it acts on, or a `kind` without a target */
export type ItemEntryDto = ChangeEntryDto & {
	kind: ItemEntryKindDto
	target: 'self' | 'chosen'
}

const idKey = {
	points: 'pointTypeId',
	item: 'itemId',
	perk: 'perkId',
	effect: 'effectId',
} as const satisfies Record<ChangeRow['kind'], keyof ChangeEntryDto>

export const toChangeRow = (entry: NamedChangeEntryDto): ChangeRow => {
	if (entry.pointTypeId != null) {
		return { kind: 'points', targetId: entry.pointTypeId, amount: entry.amount }
	}

	if (entry.itemId != null) {
		return { kind: 'item', targetId: entry.itemId, amount: entry.amount }
	}

	if (entry.perkId != null) {
		return { kind: 'perk', targetId: entry.perkId, amount: entry.amount }
	}

	if (entry.effectId != null) {
		return { kind: 'effect', targetId: entry.effectId, amount: entry.amount }
	}

	throw new Error('A change entry has no target')
}

export const toItemEntryRow = (entry: NamedItemEntryDto): ItemEntryRow => {
	const who = entry.target
	const entryId = entry.entryId === undefined ? {} : { entryId: entry.entryId }

	if (entry.kind === 'user_item') {
		return { kind: 'user-item', amount: entry.amount, who, ...entryId }
	}

	if (entry.kind === 'user_item_transfer') {
		return { kind: 'user-item-transfer', amount: entry.amount, who, ...entryId }
	}

	return { ...toChangeRow(entry), who, ...entryId }
}

export const toModifierRow = (
	modifier: NamedPointModifierDto,
): PointModifierRow => ({
	pointTypeId: modifier.pointTypeId,
	amount: modifier.amount,
})

export const fromChangeRow = ({
	kind,
	targetId,
	amount,
}: ChangeRow): ChangeEntryDto => ({ [idKey[kind]]: targetId, amount })

export const fromItemEntryRow = (row: ItemEntryRow): ItemEntryDto => {
	if (row.kind === 'user-item') {
		return { kind: 'user_item', target: row.who, amount: row.amount }
	}

	if (row.kind === 'user-item-transfer') {
		return { kind: 'user_item_transfer', target: row.who, amount: row.amount }
	}

	if (row.targetId === undefined) throw new Error('An item entry has no target')

	return {
		...fromChangeRow({
			kind: row.kind,
			targetId: row.targetId,
			amount: row.amount,
		}),
		kind: 'catalog',
		target: row.who,
	}
}

/** the contract keeps a cost positive, the backend keeps it negative; a perk or an effect is held once */
export const fromCostRow = ({ kind, targetId, amount }: SpinCostRow) =>
	fromChangeRow({
		kind,
		targetId,
		amount: kind === 'perk' ? -1 : -Math.abs(amount),
	})

/** what an exchange gives: positive, and a perk or an effect is held once */
export const fromGainRow = ({ kind, targetId, amount }: SpinCostRow) =>
	fromChangeRow({
		kind,
		targetId,
		amount: kind === 'perk' ? 1 : Math.abs(amount),
	})

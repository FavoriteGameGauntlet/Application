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

/** ItemEntry: a change entry that also says whom it acts on, or `userItem` instead of a target */
export type ItemEntryDto = ChangeEntryDto & {
	userItem?: boolean
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

	if (entry.userItem) return { kind: 'user-item', amount: entry.amount, who }

	return { ...toChangeRow(entry), who }
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
		return { userItem: true, target: row.who, amount: row.amount }
	}

	if (row.targetId === undefined) throw new Error('An item entry has no target')

	return {
		...fromChangeRow({
			kind: row.kind,
			targetId: row.targetId,
			amount: row.amount,
		}),
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

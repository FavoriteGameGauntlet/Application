import type {
	ChangeRow,
	ItemEntryRow,
	PointModifierRow,
	SpinCostRow,
} from '../api-facade/contracts'
import type { FormRow } from '../components/formDialog'

export type Parsed<T> = { value: T[] } | { error: string }

const formRow = (row: Partial<FormRow> & Pick<FormRow, 'kind'>): FormRow => ({
	targetId: '',
	amount: '1',
	who: 'self',
	...row,
})

export const changeRowsToForm = (
	rows: ChangeRow[] | SpinCostRow[],
): FormRow[] =>
	rows.map(({ kind, targetId, amount }) =>
		formRow({ kind, targetId: String(targetId), amount: String(amount) }),
	)

export const itemEntriesToForm = (rows: ItemEntryRow[]): FormRow[] =>
	rows.map(({ kind, targetId, amount, who }) =>
		formRow({
			kind,
			targetId: targetId === undefined ? '' : String(targetId),
			amount: String(amount),
			who,
		}),
	)

export const modifiersToForm = (rows: PointModifierRow[]): FormRow[] =>
	rows.map(({ pointTypeId, amount }) =>
		formRow({
			kind: 'points',
			targetId: String(pointTypeId),
			amount: String(amount),
		}),
	)

const isHeldOnce = (kind: string) => kind === 'perk' || kind === 'effect'

const readAmount = (row: FormRow, signed: boolean) => {
	const amount = Number(row.amount.trim().replace('−', '-'))

	if (!Number.isInteger(amount) || amount === 0) return undefined
	if (!signed && amount < 0) return undefined
	// a perk or an effect is held once
	if (isHeldOnce(row.kind) && Math.abs(amount) !== 1) return undefined

	return amount
}

const amountError = (row: FormRow, signed: boolean) =>
	isHeldOnce(row.kind)
		? 'Перк или эффект у игрока один: нужно 1.'
		: signed
			? 'Количество — целое число, не ноль. Минус забирает.'
			: 'Количество — целое число больше нуля.'

const readTarget = (row: FormRow) => {
	const id = Number(row.targetId)

	return Number.isInteger(id) && id > 0 ? id : undefined
}

const parseRows = <T>(
	rows: FormRow[],
	signed: boolean,
	build: (row: FormRow, targetId: number | undefined, amount: number) => T,
	needsTarget: (row: FormRow) => boolean = () => true,
): Parsed<T> => {
	const value: T[] = []

	for (const row of rows) {
		const targetId = readTarget(row)

		if (needsTarget(row) && targetId === undefined) {
			return { error: 'В строке не выбран ресурс.' }
		}

		const amount = readAmount(row, signed)

		if (amount === undefined) return { error: amountError(row, signed) }

		value.push(build(row, targetId, amount))
	}

	return { value }
}

const resourceKind = (row: FormRow) => row.kind as ChangeRow['kind']

export const parseChangeRows = (rows: FormRow[]): Parsed<ChangeRow> =>
	parseRows(rows, true, (row, targetId, amount) => ({
		kind: resourceKind(row),
		targetId: targetId ?? 0,
		amount,
	}))

export const parseCostRows = (rows: FormRow[]): Parsed<SpinCostRow> =>
	parseRows(rows, false, (row, targetId, amount) => ({
		kind: resourceKind(row),
		targetId: targetId ?? 0,
		amount,
	}))

export const parseItemEntries = (rows: FormRow[]): Parsed<ItemEntryRow> =>
	parseRows(
		rows,
		true,
		(row, targetId, amount): ItemEntryRow =>
			row.kind === 'user-item'
				? { kind: 'user-item', amount, who: row.who }
				: {
						kind: resourceKind(row),
						targetId: targetId ?? 0,
						amount,
						who: row.who,
					},
		(row) => row.kind !== 'user-item',
	)

export const parseModifiers = (rows: FormRow[]): Parsed<PointModifierRow> =>
	parseRows(rows, true, (_, targetId, amount) => ({
		pointTypeId: targetId ?? 0,
		amount,
	}))

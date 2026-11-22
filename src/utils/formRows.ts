import type {
	ChangeRow,
	GameEndState,
	ItemEntryRow,
	PerkTrigger,
	PointModifierRow,
	SpinCostRow,
} from '../api-facade/contracts'
import type {
	FormProblem,
	FormRow,
	TriggerFormRow,
} from '../components/formDialog'
import { triggerFilterOf } from './perkTrigger'

export type Parsed<T> = { value: T[] } | { problem: FormProblem }

/** what is wrong with the rows, for the `check` of a `rows` field */
export const problemOf = <T>(parsed: Parsed<T>) =>
	'problem' in parsed ? parsed.problem : undefined

/** the parsed rows; a form saves only once its rows parse, so a problem gives none */
export const parsedRows = <T>(parsed: Parsed<T>) =>
	'value' in parsed ? parsed.value : []

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

const amountRule = (row: FormRow, signed: boolean) =>
	isHeldOnce(row.kind)
		? 'должно быть 1: перк или эффект у игрока один'
		: signed
			? 'должно быть целым и не нулём'
			: 'должно быть целым и больше нуля'

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

	for (const [i, row] of rows.entries()) {
		const targetId = readTarget(row)
		const line = i + 1

		if (needsTarget(row) && targetId === undefined) {
			return {
				problem: {
					text: `Ресурс в строке ${line} должен быть выбран`,
					row: i,
					cell: 'target',
				},
			}
		}

		// a transfer moves copies, so its amount is a plain count
		const rowSigned = signed && row.kind !== 'user-item-transfer'
		const amount = readAmount(row, rowSigned)

		if (amount === undefined)
			return {
				problem: {
					text: `Количество в строке ${line} ${amountRule(row, rowSigned)}`,
					row: i,
					cell: 'amount',
				},
			}

		value.push(build(row, targetId, amount))
	}

	return { value }
}

const resourceKind = (row: FormRow) => row.kind as ChangeRow['kind']

/** the copies are picked when the item is used, so the row names no resource */
const isPickedCopies = (
	row: FormRow,
): row is FormRow & { kind: 'user-item' | 'user-item-transfer' } =>
	row.kind === 'user-item' || row.kind === 'user-item-transfer'

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
			isPickedCopies(row)
				? { kind: row.kind, amount, who: row.who }
				: {
						kind: resourceKind(row),
						targetId: targetId ?? 0,
						amount,
						who: row.who,
					},
		(row) => !isPickedCopies(row),
	)

export const parseModifiers = (rows: FormRow[]): Parsed<PointModifierRow> =>
	parseRows(rows, true, (_, targetId, amount) => ({
		pointTypeId: targetId ?? 0,
		amount,
	}))

/** the triggers of a saved ability as the rows of a `triggers` field */
export const triggersToForm = (triggers: PerkTrigger[]): TriggerFormRow[] =>
	triggers.map(({ action, eventKind, pointTypeId, gameEndState }) => ({
		action,
		eventKind,
		filter:
			pointTypeId !== undefined ? String(pointTypeId) : (gameEndState ?? ''),
	}))

/** an empty filter matches any point type or end state */
export const parseTriggers = (rows: TriggerFormRow[]): PerkTrigger[] =>
	rows.map(({ action, eventKind, filter }) => {
		const narrows = triggerFilterOf(eventKind)

		return {
			action,
			eventKind,
			...(filter &&
				narrows === 'point-type' && { pointTypeId: Number(filter) }),
			...(filter &&
				narrows === 'end-state' && { gameEndState: filter as GameEndState }),
		}
	})

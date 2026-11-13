import type {
	CatalogEntry,
	CatalogKind,
	ResourceKind,
} from '../api-facade/contracts'
import { formatSpan } from '../utils/format'

/** the tabs of the catalogue: the point types are split into own and shared ones */
export type CatalogView = 'points' | 'shared' | ResourceKind

export type CatalogTableRow = {
	entry: CatalogEntry
	/** the changes as tags in the second wide column, the point types have no such column */
	main?: string[]
	/** the narrow columns after it */
	extra: string[]
	notes: string[]
}

export const catalogViews: { value: CatalogView; label: string }[] = [
	{ value: 'points', label: 'Очки' },
	{ value: 'shared', label: 'Общие очки' },
	{ value: 'items', label: 'Предметы' },
	{ value: 'perks', label: 'Перки' },
	{ value: 'effects', label: 'Эффекты' },
]

const pointsHeads = ['Тип очков', 'Минимум', 'Максимум']

export const catalogHeads: Record<CatalogView, string[]> = {
	points: pointsHeads,
	shared: pointsHeads,
	items: ['Предмет', 'Изменение', 'Использований'],
	perks: ['Перк', 'Эффект', 'Тип'],
	effects: ['Эффект', 'Изменение', 'Длительность'],
}

export const catalogKindOf = (view: CatalogView): CatalogKind =>
	view === 'points' || view === 'shared' ? 'point-types' : view

/** the wide columns: the name, and the changes for everything but the point types */
export const catalogWide = (view: CatalogView) =>
	catalogKindOf(view) === 'point-types' ? 1 : 2

/** the cells of an entry after its name, in the order of `catalogHeads` */
export const catalogCells = (
	view: CatalogView,
	entry: CatalogEntry,
): Pick<CatalogTableRow, 'main' | 'extra' | 'notes'> => {
	switch (view) {
		case 'points':
		case 'shared':
			return {
				extra: [String(entry.minimum ?? '—'), String(entry.maximum ?? '—')],
				notes: [`Стартовое значение: ${entry.startValue}`],
			}
		case 'items':
			return {
				main: entry.changes ?? [],
				extra: [String(entry.usesMax ?? 1)],
				notes: [],
			}
		case 'perks':
			return {
				main: entry.changes ?? [],
				extra: [entry.perkKind === 'active' ? 'активный' : 'пассивный'],
				notes: [],
			}
		case 'effects':
			return {
				main: entry.changes ?? [],
				extra: [entry.duration ? formatSpan(entry.duration) : '—'],
				notes: [],
			}
	}
}

/** the rows that match the search text by the name, the description or the changes */
export const filterCatalogRows = (rows: CatalogTableRow[], query: string) => {
	const q = query.trim().toLowerCase()

	return rows.filter(
		(row) =>
			!q ||
			[row.entry.name, row.entry.description, ...(row.main ?? [])].some((s) =>
				s.toLowerCase().includes(q),
			),
	)
}

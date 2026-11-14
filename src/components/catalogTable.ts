import type {
	CatalogEntry,
	CatalogKind,
	ResourceKind,
} from '../api-facade/contracts'
import { formatBounds, formatSpan } from '../utils/format'
import { itemConditionLabels } from '../utils/itemCondition'

/** the tabs of the catalogue: the point types are split into own and shared ones */
export type CatalogView = 'points' | 'shared' | ResourceKind

export type CatalogTone = 'plus' | 'minus' | 'plain'

/** a change of the entry in its row: green adds, red takes */
export type CatalogTag = { text: string; tone: CatalogTone }

export const catalogViews: { value: CatalogView; label: string }[] = [
	{ value: 'points', label: 'Очки' },
	{ value: 'shared', label: 'Общие очки' },
	{ value: 'items', label: 'Предметы' },
	{ value: 'perks', label: 'Перки' },
	{ value: 'effects', label: 'Эффекты' },
]

export const changeTone = (amount: number): CatalogTone =>
	amount > 0 ? 'plus' : amount < 0 ? 'minus' : 'plain'

const pointsHeads = ['Название', 'Единицы в журнале', 'Границы и старт']

/** the column titles of the admin table, the name first */
export const catalogHeads: Record<CatalogView, string[]> = {
	points: pointsHeads,
	shared: pointsHeads,
	items: ['Название', 'При использовании', 'Параметры'],
	perks: ['Название', 'Пока перк у игрока', 'Способность'],
	effects: ['Название', 'Пока действует', 'Срок'],
}

/** the title of the holders column; perks and effects have no count */
export const catalogHolders: Partial<Record<CatalogView, string>> = {
	points: 'Всего у игроков',
	shared: 'Всего у игроков',
	items: 'У игроков',
}

export const catalogKindOf = (view: CatalogView): CatalogKind =>
	view === 'points' || view === 'shared' ? 'point-types' : view

/** `changes` holds the texts of the modifiers first, a perk then adds those of its ability */
const modifierTags = (entry: CatalogEntry, count: number): CatalogTag[] =>
	(entry.changes ?? []).slice(0, count).map((text, i) => ({
		text,
		tone: changeTone(entry.modifiers?.[i]?.amount ?? 0),
	}))

/** what the entry changes; the point types show the forms of their unit instead */
export const catalogTags = (
	view: CatalogView,
	entry: CatalogEntry,
): CatalogTag[] => {
	switch (view) {
		case 'points':
		case 'shared':
			return entry.unitForms
				? [
						entry.unitForms.one,
						entry.unitForms.several,
						entry.unitForms.many,
					].map((text) => ({ text, tone: 'plain' }))
				: []
		case 'items':
			return (entry.entries ?? []).map((row, i) => ({
				text: entry.changes?.[i] ?? '',
				tone:
					row.kind === 'user-item-transfer' ? 'plain' : changeTone(row.amount),
			}))
		case 'perks':
			return modifierTags(entry, entry.modifiers?.length ?? 0)
		case 'effects':
			return modifierTags(entry, entry.changes?.length ?? 0)
	}
}

/** the properties of the entry as short facts */
export const catalogFacts = (view: CatalogView, entry: CatalogEntry) => {
	switch (view) {
		case 'points':
		case 'shared':
			return [
				formatBounds(entry.minimum ?? null, entry.maximum ?? null),
				`старт ${entry.startValue ?? 0}`,
				...(entry.isPublic === false ? ['только админы'] : []),
			]
		case 'items':
			return [
				`×${entry.usesMax ?? 1}`,
				entry.shouldApplyToAll === false ? 'игрок выбирает' : 'всё сразу',
				...(entry.conditions ?? []).map((c) =>
					itemConditionLabels[c].label.toLowerCase(),
				),
			]
		case 'perks': {
			const { ability } = entry

			if (!ability) return ['Пассивный']

			return [
				'Активный',
				...(ability.uses ? [`максимум ${ability.uses.max}`] : ['без лимита']),
				...(ability.chargesMax > 0 ? [`заряды ${ability.chargesMax}`] : []),
				...(ability.renewalPeriod
					? [`восстановление ${formatSpan(ability.renewalPeriod)}`]
					: []),
			]
		}
		case 'effects':
			return [entry.duration ? formatSpan(entry.duration) : 'Пока не снимут']
	}
}

/** the entries that match the search text by the name, the description or the changes */
export const filterCatalogEntries = (
	entries: CatalogEntry[],
	query: string,
) => {
	const q = query.trim().toLowerCase()

	return entries.filter(
		(entry) =>
			!q ||
			[entry.name, entry.description, ...(entry.changes ?? [])].some((s) =>
				s.toLowerCase().includes(q),
			),
	)
}

/** the lines under the name in the catalogue list, a fact each, and the badge on the right of them */
export const catalogSummary = (
	view: CatalogView,
	entry: CatalogEntry,
): { summary: string[]; badge?: string } => {
	const changes = entry.changes ?? []

	switch (view) {
		case 'points':
		case 'shared':
			return {
				summary: [
					formatBounds(entry.minimum ?? null, entry.maximum ?? null),
					`старт ${entry.startValue ?? 0}`,
				],
				badge: entry.isPublic === false ? 'админы' : undefined,
			}
		case 'items':
			return { summary: changes, badge: `×${entry.usesMax ?? 1}` }
		case 'perks':
			return {
				summary: changes,
				badge: entry.perkKind === 'active' ? 'активный' : 'пассивный',
			}
		case 'effects':
			return {
				summary: changes,
				badge: entry.duration ? formatSpan(entry.duration) : 'без срока',
			}
	}
}

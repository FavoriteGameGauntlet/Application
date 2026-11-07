import type {
	AdminExchange,
	AdminExchangeInput,
	AdminWheelGroup,
	Api,
	CatalogEntry,
	CatalogEntryInput,
	CatalogKind,
	ChangeRow,
	ItemEntryRow,
	PointModifierRow,
	ResourceRef,
	SpinCostRow,
} from '../contracts'
import { countItems } from '../../utils/userItems'
import * as adminDb from './adminDb'
import * as db from './db'
import { fail, newId, reply } from './helpers'
import { signedText } from './journal'

const costCatalog = {
	points: 'point-types',
	item: 'items',
	perk: 'perks',
	effect: 'effects',
} as const

const nameOf = (kind: ChangeRow['kind'], id: number) =>
	adminDb.catalog[costCatalog[kind]].find((e) => e.id === id)?.name ?? ''

const toRef = (kind: ChangeRow['kind'], id: number, amount: number): ResourceRef => {
	const name = nameOf(kind, id)

	return kind === 'perk' || kind === 'effect'
		? { kind, id, name }
		: { kind, id, name, amount }
}

/** «+50 Золото», «−1 Щит», «+перк Коллекционер» */
const changeText = ({ kind, targetId, amount }: ChangeRow) =>
	`${amount < 0 && (kind === 'perk' || kind === 'effect') ? '−' : ''}${signedText(toRef(kind, targetId, amount))}`

const entryText = (row: ItemEntryRow) => {
	const text =
		row.kind === 'user-item'
			? `${row.amount < 0 ? '−' : '+'}выбранный предмет${Math.abs(row.amount) > 1 ? ` ×${Math.abs(row.amount)}` : ''}`
			: changeText({ kind: row.kind, targetId: row.targetId ?? 0, amount: row.amount })

	return row.who === 'chosen' ? `${text} (выбранным игрокам)` : text
}

const modifierText = (m: PointModifierRow) =>
	changeText({ kind: 'points', targetId: m.pointTypeId, amount: m.amount })

/** the text that the catalogue shows for the structured fields of an entry */
const changesOf = (input: CatalogEntryInput): string[] => [
	...(input.modifiers ?? []).map(modifierText),
	...(input.entries ?? []).map(entryText),
	...(input.ability?.entries ?? []).map(entryText),
]

const withChanges = (input: CatalogEntryInput): CatalogEntryInput & { changes?: string[] } => {
	const changes = changesOf(input)

	return changes.length ? { ...input, changes } : input
}

const toExchangeSides = ({ sourceEntries, targetEntries }: AdminExchangeInput) => {
	const refs = (rows: SpinCostRow[]) => rows.map((r) => toRef(r.kind, r.targetId, r.amount))

	return { sourceEntries: refs(sourceEntries), targetEntries: refs(targetEntries) }
}

/** how many of the resource the users hold altogether */
const holders = (kind: CatalogKind, id: number) => {
	const all = Object.values(db.resources)

	switch (kind) {
		case 'point-types':
			return all.reduce((sum, r) => sum + (r.points[id] ?? 0), 0)
		case 'items':
			return all.reduce((sum, r) => sum + countItems(r.items, id), 0)
		case 'perks':
			return all.filter((r) => r.perks.some((p) => p.id === id)).length
		case 'effects':
			return all.filter((r) => r.effects.some((e) => e.id === id)).length
	}
}

const findEntry = (kind: CatalogKind, id: number) => {
	const entry = adminDb.catalog[kind].find((e) => e.id === id)

	if (!entry) fail(404, 'NOT_FOUND', 'Запись не найдена')

	return entry
}

const withHolders = (kind: CatalogKind, entry: CatalogEntry): CatalogEntry => ({
	...entry,
	holdersTotal: holders(kind, entry.id),
})

const toAdminExchange = (def: db.ExchangeDef): AdminExchange => ({
	...def,
	deleted: adminDb.deletedExchangeIds.has(def.id),
})

const findExchange = (id: number) => {
	const def = db.exchangeDefs.find((d) => d.id === id)

	if (!def) fail(404, 'NOT_FOUND', 'Обмен не найден')

	return def
}

const findGroup = (groupId: number) => {
	const group = adminDb.wheelGroups.find((g) => g.id === groupId)

	if (!group) fail(404, 'NOT_FOUND', 'Группа не найдена')

	return group
}

const findMember = (login: string) => {
	const member = adminDb.members.find((m) => m.login === login)

	if (!member) fail(404, 'NOT_FOUND', 'Игрок не найден')

	return member
}

const requireAnotherAdmin = (login: string) => {
	const others = adminDb.members.filter((m) => m.isAdmin && m.login !== login)

	if (!others.length) fail(409, 'LAST_ADMIN', 'Это последний админ пати')
}

const findParam = (key: string) => {
	const param = adminDb.params.find((p) => p.key === key)

	if (!param) fail(404, 'NOT_FOUND', 'Параметр не найден')

	return param
}

export const adminApi: Api['admin'] = {
	catalog: {
		list: (kind, includeDeleted) =>
			reply(() =>
				adminDb.catalog[kind]
					.filter((e) => includeDeleted || !e.deleted)
					.map((e) => withHolders(kind, e)),
			),
		create: (kind, input) =>
			reply(() => {
				const entry: CatalogEntry = {
					...withChanges(input),
					perkKind: input.ability ? 'active' : input.perkKind,
					id: newId(),
					deleted: false,
				}

				adminDb.catalog[kind].push(entry)

				if (kind === 'point-types') {
					db.pointTypes.push({
						id: entry.id,
						name: entry.name,
						description: entry.description,
						unitForms: entry.unitForms ?? {
								one: entry.name,
								several: entry.name,
								many: entry.name,
							},
						startValue: entry.startValue ?? 0,
						isPublic: entry.isPublic ?? true,
						isShared: entry.isShared ?? false,
						minimum: entry.minimum ?? null,
						maximum: entry.maximum ?? null,
					})

					if (entry.isShared) db.sharedPoints[entry.id] = entry.startValue ?? 0
				}

				return withHolders(kind, entry)
			}),
		update: (kind, id, input) =>
			reply(() => {
				const entry = findEntry(kind, id)

				Object.assign(entry, withChanges(input))

				const type = db.pointTypes.find((t) => t.id === id)

				if (kind === 'point-types' && type) {
					type.name = entry.name
					type.description = entry.description
					type.unitForms = entry.unitForms ?? type.unitForms
					type.startValue = entry.startValue ?? type.startValue
					type.isPublic = entry.isPublic ?? type.isPublic
					type.minimum = entry.minimum === undefined ? type.minimum : entry.minimum
					type.maximum = entry.maximum === undefined ? type.maximum : entry.maximum
				}

				return withHolders(kind, entry)
			}),
		remove: (kind, id) =>
			reply(() => {
				findEntry(kind, id).deleted = true
			}),
		restore: (kind, id) =>
			reply(() => {
				findEntry(kind, id).deleted = false
			}),
	},

	exchanges: {
		list: (includeDeleted) =>
			reply(() =>
				db.exchangeDefs
					.map(toAdminExchange)
					.filter((x) => includeDeleted || !x.deleted),
			),
		create: (input) =>
			reply(() => {
				const def: db.ExchangeDef = {
					id: newId(),
					name: input.name,
					description: input.description,
					...toExchangeSides(input),
				}

				db.exchangeDefs.push(def)

				return toAdminExchange(def)
			}),
		update: (id, input) =>
			reply(() => {
				const def = findExchange(id)

				Object.assign(def, {
					name: input.name,
					description: input.description,
					...toExchangeSides(input),
				})

				return toAdminExchange(def)
			}),
		remove: (id) =>
			reply(() => {
				adminDb.deletedExchangeIds.add(findExchange(id).id)
			}),
		restore: (id) =>
			reply(() => {
				adminDb.deletedExchangeIds.delete(findExchange(id).id)
			}),
	},

	wheel: {
		groups: (kind) =>
			reply(() => adminDb.wheelGroups.filter((g) => g.kind === kind)),
		createGroup: (kind, name) =>
			reply(() => {
				const group: AdminWheelGroup = {
					id: newId(),
					name,
					kind,
					system: false,
					noRepeat: false,
					entries: [],
				}

				adminDb.wheelGroups.push(group)

				return group
			}),
		renameGroup: (groupId, name) =>
			reply(() => {
				findGroup(groupId).name = name
			}),
		setNoRepeat: (groupId, noRepeat) =>
			reply(() => {
				findGroup(groupId).noRepeat = noRepeat
			}),
		removeGroup: (groupId) =>
			reply(() => {
				adminDb.wheelGroups.splice(adminDb.wheelGroups.indexOf(findGroup(groupId)), 1)
			}),
		saveEntry: (groupId, entryId, input) =>
			reply(() => {
				const group = findGroup(groupId)

				if (group.system) fail(409, 'SYSTEM_GROUP', 'Эту группу нельзя менять')

				const next = { ...input, changes: input.entries.map(changeText) }

				if (entryId === undefined) {
					group.entries.push({ id: newId(), ...next })
					return
				}

				const entry = group.entries.find((e) => e.id === entryId)

				if (!entry) fail(404, 'NOT_FOUND', 'Пункт не найден')

				Object.assign(entry, next)
			}),
		removeEntry: (groupId, entryId) =>
			reply(() => {
				const group = findGroup(groupId)

				group.entries = group.entries.filter((e) => e.id !== entryId)
			}),
		spinCost: (groupId) =>
			reply(() =>
				(db.spinCosts[findGroup(groupId).id] ?? []).map((r) => ({
					kind: r.kind,
					targetId: r.id,
					amount: r.amount,
				})),
			),
		saveSpinCost: (groupId, rows) =>
			reply(() => {
				const group = findGroup(groupId)

				if (group.kind !== 'changes') fail(409, 'NOT_CHANGES_GROUP', 'Игры крутятся бесплатно')

				db.spinCosts[group.id] = rows.map((row) => ({
					kind: row.kind,
					id: row.targetId,
					name:
						adminDb.catalog[costCatalog[row.kind]].find((e) => e.id === row.targetId)
							?.name ?? '',
					amount: row.amount,
				}))
			}),
	},

	rewards: {
		get: () => reply(() => adminDb.rewards),
		save: (rewards) =>
			reply(() => {
				adminDb.rewards.timer = rewards.timer
				adminDb.rewards.game = rewards.game
			}),
	},

	members: {
		list: () => reply(() => adminDb.members),
		add: (login) =>
			reply(() => {
				if (adminDb.members.some((m) => m.login === login)) {
					fail(409, 'ALREADY_MEMBER', 'Игрок уже в пати')
				}

				const member = {
					login,
					displayName: null,
					joinedDate: new Date().toISOString(),
					isAdmin: false,
				}

				adminDb.members.push(member)

				return member
			}),
		update: (login, input) =>
			reply(() => {
				const member = findMember(login)

				if (member.isAdmin && !input.isAdmin) requireAnotherAdmin(login)

				Object.assign(member, input)

				return member
			}),
		remove: (login) =>
			reply(() => {
				const member = findMember(login)

				if (member.isAdmin) requireAnotherAdmin(login)

				adminDb.members.splice(adminDb.members.indexOf(member), 1)
			}),
	},

	params: {
		list: () => reply(() => adminDb.params),
		set: (key, value) =>
			reply(() => {
				const param = findParam(key)

				param.value = value

				return param
			}),
		reset: (key) =>
			reply(() => {
				const param = findParam(key)

				param.value = param.default

				return param
			}),
	},
}

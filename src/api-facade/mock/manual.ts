import { formatSpan } from '../../utils/format'
import { countItems } from '../../utils/userItems'
import type {
	Effect,
	JournalEntry,
	ManualRequest,
	Perk,
	PointType,
	Seconds,
	UserItem,
	UserResources,
} from '../contracts'
import * as adminDb from './adminDb'
import * as db from './db'
import { fail } from './helpers'
import { pushJournal, signedText } from './journal'

const catalogEntry = (kind: 'items' | 'perks' | 'effects', id: number) => {
	const entry = adminDb.catalog[kind].find((e) => e.id === id)

	if (!entry) fail(404, 'NOT_FOUND', 'Запись каталога не найдена')

	return entry
}

/** `count` new copies of the item */
export const itemCopies = (id: number, count: number): UserItem[] => {
	const entry = catalogEntry('items', id)

	if (db.itemCatalog[entry.name]) return db.makeItems(entry.name, count)

	return Array.from({ length: count }, () => ({
		id: db.newUserItemId(),
		itemId: id,
		name: entry.name,
		description: entry.changes?.join(', ') || entry.description,
		usesLeft: 1,
		usesMax: 1,
	}))
}

/** takes away `count` copies of the item, the most used ones first */
export const removeItems = (res: UserResources, itemId: number, count: number) => {
	const doomed = res.items
		.filter((i) => i.itemId === itemId)
		.sort((a, b) => a.usesLeft - b.usesLeft)
		.slice(0, count)

	res.items = res.items.filter((i) => !doomed.includes(i))
}

export const perkOf = (id: number): Perk => {
	const entry = catalogEntry('perks', id)

	if (db.perkCatalog[entry.name]) return db.makePerk(entry.name)

	const active = entry.perkKind === 'active'

	return {
		id,
		name: entry.name,
		effect: { name: entry.changes?.[0] ?? entry.name, text: entry.description },
		kind: active ? 'active' : 'passive',
		...(active && { usesLeft: 1, usesMax: 1 }),
	}
}

const effectOf = (id: number, duration?: Seconds): Effect => {
	const entry = catalogEntry('effects', id)

	return {
		id,
		name: entry.name,
		description: entry.description,
		source: `вручную · ${db.ME}`,
		expiresAt: duration ? new Date(Date.now() + duration * 1000).toISOString() : null,
		...(entry.usesMax != null && { usesLeft: entry.usesMax, usesMax: entry.usesMax }),
	}
}

const sourceOf = (request: ManualRequest): JournalEntry['source'] => {
	if (request.correctsEntryId !== undefined) {
		if (!db.journal.some((e) => e.id === request.correctsEntryId)) {
			fail(404, 'NOT_FOUND', 'Запись журнала не найдена')
		}

		return { type: 'manual' }
	}

	const spin =
		request.spinId === undefined ? undefined : db.state.appliedSpins[request.spinId]

	if (spin) return { type: 'wheel_row', id: spin.result.id, name: spin.result.name }

	return { type: 'manual' }
}

const pointTypeOf = (id: number, shared: boolean) => {
	const type = db.pointTypes.find((t) => t.id === id && t.isShared === shared)

	if (!type) fail(404, 'NOT_FOUND', 'Тип очков не найден')

	return type
}

/** the new value of the points has to stay within the bounds of the type */
const checkedValue = (type: PointType, value: number) => {
	if (
		(type.minimum !== null && value < type.minimum) ||
		(type.maximum !== null && value > type.maximum)
	) {
		fail(409, 'OUT_OF_BOUNDS', `${type.name}: значение выходит за границы`)
	}

	return value
}

/** all or nothing: a failed change leaves the resources as they were */
export const applyManual = (request: ManualRequest): JournalEntry => {
	if (!request.changes.length) fail(422, 'EMPTY', 'Нет изменений')

	const source = sourceOf(request)
	const draft = structuredClone(db.resources)
	const shared = { ...db.sharedPoints }
	const lines: JournalEntry['changes'] = []

	for (const change of request.changes) {
		if (change.kind === 'shared-points') {
			const type = pointTypeOf(change.id, true)
			const value = checkedValue(type, (shared[change.id] ?? 0) + change.delta)
			const resource = {
				kind: 'points',
				id: type.id,
				name: type.name,
				amount: change.delta,
			} as const

			shared[change.id] = value
			lines.push({ login: null, text: signedText(resource), resource })
			continue
		}

		const res = draft[change.user]
		const { user } = change

		if (!res) fail(404, 'USER_NOT_FOUND', 'Игрок не найден')

		switch (change.kind) {
			case 'points': {
				const type = pointTypeOf(change.id, false)
				const resource = {
					kind: 'points',
					id: type.id,
					name: type.name,
					amount: change.delta,
				} as const

				res.points[change.id] = checkedValue(type, (res.points[change.id] ?? 0) + change.delta)
				lines.push({ login: user, text: signedText(resource), resource })
				break
			}
			case 'item': {
				const name = catalogEntry('items', change.id).name
				const held = countItems(res.items, change.id)

				if (held + change.delta < 0) {
					fail(409, 'INSUFFICIENT', `Не хватает: ${name} у ${user}`)
				}

				if (change.delta > 0) {
					res.items.push(...itemCopies(change.id, change.delta))
				} else {
					removeItems(res, change.id, -change.delta)
				}

				lines.push({
					login: user,
					text: `${change.delta < 0 ? '−' : '+'}${Math.abs(change.delta)} ${name}`,
					resource: { kind: 'item', id: change.id, name, amount: change.delta },
				})
				break
			}
			case 'perk': {
				const name = catalogEntry('perks', change.id).name
				const owned = res.perks.some((p) => p.id === change.id)
				const grant = change.op === 'grant'

				if (!grant && !owned) fail(409, 'NOT_OWNED', `У ${user} нет: ${name}`)

				if (grant && !owned) res.perks.push(perkOf(change.id))
				if (!grant) res.perks = res.perks.filter((p) => p.id !== change.id)

				lines.push({
					login: user,
					text: `${grant ? '+' : '−'}перк ${name}`,
					resource: { kind: 'perk', id: change.id, name },
				})
				break
			}
			case 'effect': {
				const name = catalogEntry('effects', change.id).name
				const owned = res.effects.some((e) => e.id === change.id)
				const grant = change.op === 'grant'

				if (!grant && !owned) fail(409, 'NOT_OWNED', `У ${user} нет: ${name}`)

				res.effects = res.effects.filter((e) => e.id !== change.id)

				if (grant) res.effects.push(effectOf(change.id, change.duration))

				lines.push({
					login: user,
					text: grant
						? `эффект ${name}${change.duration ? ` · ${formatSpan(change.duration)}` : ''}`
						: `снят эффект ${name}`,
					resource: { kind: 'effect', id: change.id, name, duration: change.duration },
				})
				break
			}
		}
	}

	Object.assign(db.resources, draft)
	Object.assign(db.sharedPoints, shared)

	return pushJournal(source, true, lines, request.correctsEntryId)
}

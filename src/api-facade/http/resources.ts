import { formatJournalSource } from '../../utils/format'
import type {
	Api,
	Effect,
	ISODate,
	ItemCondition,
	JournalSource,
	Login,
	Perk,
	PointType,
	ResourceKind,
	UserItem,
} from '../contracts'
import { http } from '../http'
import { Temporal } from '@js-temporal/polyfill'
import {
	type NamedItemEntryDto,
	type NamedPointModifierDto,
	toItemEntryText,
	toModifierText,
} from './changeEntry'
import { type CatalogDto, countHolders, toCatalogEntry } from './catalogEntries'
import {
	currentLogin,
	getMembers,
	getPointTypes,
	partyPath,
	toSeconds,
	userRefOf,
} from './context'
import { journal, latestOwnEntry } from './journal'
import { toItemEntryRow } from './rows'

type PointValueDto = { pointType: PointType; value: number }

type UserItemDto = {
	id: number
	itemId: number
	name: string
	description: string
	usesMax: number
	usesLeft: number
	shouldApplyToAll: boolean
	entries: NamedItemEntryDto[]
	conditions: ItemCondition[]
}

type UserPerkDto = {
	perkId: number
	name: string
	description: string
	modifiers: NamedPointModifierDto[]
	ability?: {
		shouldApplyToAll: boolean
		entries: NamedItemEntryDto[]
		uses?: { max: number; start: number }
		usesLeft?: number
	}
}

type UserEffectDto = {
	id: number
	name: string
	description: string
	/** ISO 8601 duration, left out for a copy that lasts until it is ended */
	duration?: string
	startedDate: string
	source: JournalSource
}

/** the entries of a held item or perk, with the text a user picks them by */
const toUseEntries = (entries: NamedItemEntryDto[], pointTypes: PointType[]) =>
	entries.map((e) => ({
		...toItemEntryRow(e),
		text: toItemEntryText(e, pointTypes),
	}))

const toUserItem = (dto: UserItemDto, pointTypes: PointType[]): UserItem => ({
	id: dto.id,
	itemId: dto.itemId,
	name: dto.name,
	description:
		dto.entries.map((e) => toItemEntryText(e, pointTypes)).join(', ') ||
		dto.description,
	usesLeft: dto.usesLeft,
	usesMax: dto.usesMax,
	shouldApplyToAll: dto.shouldApplyToAll,
	entries: toUseEntries(dto.entries, pointTypes),
	conditions: dto.conditions,
})

const toUserPerk = (dto: UserPerkDto, pointTypes: PointType[]): Perk => {
	const { ability } = dto

	return {
		id: dto.perkId,
		name: dto.name,
		description: dto.description,
		modifiers: dto.modifiers.map((m) => toModifierText(m, pointTypes)),
		kind: ability ? 'active' : 'passive',
		...(ability?.uses && { usesMax: ability.uses.max }),
		...(ability?.usesLeft !== undefined && { usesLeft: ability.usesLeft }),
		...(ability && {
			abilityEntries: toUseEntries(ability.entries, pointTypes),
			abilityShouldApplyToAll: ability.shouldApplyToAll,
		}),
	}
}

const toUserEffect = (dto: UserEffectDto): Effect => ({
	id: dto.id,
	name: dto.name,
	description: dto.description,
	source: formatJournalSource(dto.source),
	expiresAt: dto.duration
		? (Temporal.Instant.from(dto.startedDate)
				.add({ seconds: toSeconds(dto.duration) })
				.toString() as ISODate)
		: null,
})

const refKind = {
	items: 'item',
	perks: 'perk',
	effects: 'effect',
} as const satisfies Record<ResourceKind, string>

export const resources: Api['resources'] = {
	pointTypes: getPointTypes,

	sharedPoints: async () => {
		const points = (
			await http.get<{ response: PointValueDto[] }>(
				`${await partyPath()}/points/party`,
			)
		).body

		return Object.fromEntries(points.map((p) => [p.pointType.id, p.value]))
	},

	leaderboard: async (typeId) => {
		const path = await partyPath()
		const [members, { body: users }] = await Promise.all([
			getMembers(),
			http.get<{ response: { login: Login; points: PointValueDto[] }[] }>(
				`${path}/points/users`,
			),
		])

		return {
			typeId,
			rows: users
				.map(({ login, points }) => ({
					user: userRefOf(members, login),
					value: points.find((p) => p.pointType.id === typeId)?.value ?? 0,
				}))
				.sort((a, b) => b.value - a.value),
		}
	},

	user: async (login) => {
		const path = await partyPath()
		const [members, pointTypes, points, items, perks, effects] =
			await Promise.all([
				getMembers(),
				getPointTypes(),
				http.get<{ response: PointValueDto[] }>(
					`${path}/points/users/${login}`,
				),
				http.get<{ response: UserItemDto[] }>(`${path}/items/${login}`),
				http.get<{ response: UserPerkDto[] }>(`${path}/perks/${login}`),
				http.get<{ response: UserEffectDto[] }>(`${path}/effects/${login}`),
			])

		return {
			user: userRefOf(members, login),
			points: Object.fromEntries(
				points.body.map((p) => [p.pointType.id, p.value]),
			),
			items: items.body.map((i) => toUserItem(i, pointTypes)),
			perks: perks.body.map((p) => toUserPerk(p, pointTypes)),
			effects: effects.body.map(toUserEffect),
		}
	},

	summary: async (kind) => {
		const path = await partyPath()

		return Promise.all(
			(await getMembers()).map(async ({ login }) => ({
				login,
				count: (
					await http.get<{ response: unknown[] }>(`${path}/${kind}/${login}`)
				).body.length,
			})),
		)
	},

	catalog: async (kind) =>
		(
			await http.get<{ response: { id: number; name: string }[] }>(
				`${await partyPath()}/${kind}/catalog`,
			)
		).body.map(({ id, name }) => ({ id, name })),

	catalogEntries: async (kind) => {
		const [{ body }, pointTypes, holders] = await Promise.all([
			partyPath().then((path) =>
				http.get<{ response: CatalogDto[typeof kind][] }>(
					`${path}/${kind}/catalog`,
				),
			),
			getPointTypes(),
			countHolders(kind),
		])

		return body.map((dto) => ({
			...toCatalogEntry(kind, dto, pointTypes),
			holdersTotal: holders.get(dto.id) ?? 0,
		}))
	},

	useItem: async (userItemId, use) => {
		await http.post(
			`${await partyPath()}/items/${await currentLogin()}/${userItemId}/use`,
			{ body: use },
		)

		return { journalEntry: await latestOwnEntry() }
	},

	usePerk: async (perkId, use) => {
		await http.post(
			`${await partyPath()}/perks/${await currentLogin()}/${perkId}/use`,
			{ body: use },
		)

		return { journalEntry: await latestOwnEntry() }
	},

	history: async (login, kind, id, limit = 4) => {
		const { items } = await journal.list({
			user: login,
			resource: { kind: refKind[kind], id },
			limit,
		})

		return items
			.flatMap((entry) =>
				entry.changes
					.filter((c) => c.login === login)
					.map((c) => ({
						at: entry.at,
						source: formatJournalSource(entry.source, entry.correctsEntryId),
						delta: c.text.match(/^[+−-]\d+/)?.[0] ?? c.text,
					})),
			)
			.slice(0, limit)
	},
}

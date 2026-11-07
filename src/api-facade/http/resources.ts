import { formatJournalSource } from '../../utils/format'
import type {
	Api,
	Login,
	PointType,
	ResourceKind,
} from '../contracts'
import { http } from '../http'
import { type CatalogDto, countHolders, toCatalogEntry } from './catalogEntries'
import {
	currentLogin,
	getMembers,
	getPointTypes,
	partyPath,
	toUserRefs,
	userRefOf,
} from './context'
import { journal, latestOwnEntry } from './journal'

type PointValueDto = { pointType: PointType; value: number }

const refKind = {
	items: 'item',
	perks: 'perk',
	effects: 'effect',
} as const satisfies Record<ResourceKind, string>

export const resources: Pick<
	Api['resources'],
	| 'pointTypes'
	| 'sharedPoints'
	| 'leaderboard'
	| 'summary'
	| 'catalog'
	| 'catalogEntries'
	| 'useItem'
	| 'usePerk'
	| 'history'
> = {
	pointTypes: getPointTypes,

	sharedPoints: async () => {
		const points = (
			await http.get<{ response: PointValueDto[] }>(`${await partyPath()}/points/party`)
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
		const refs = toUserRefs(members)

		return {
			typeId,
			rows: users
				.map(({ login, points }) => ({
					user: userRefOf(refs, login),
					value: points.find((p) => p.pointType.id === typeId)?.value ?? 0,
				}))
				.sort((a, b) => b.value - a.value),
		}
	},

	summary: async (kind) => {
		const path = await partyPath()

		return Promise.all(
			(await getMembers()).map(async ({ login }) => ({
				login,
				count: (await http.get<{ response: unknown[] }>(`${path}/${kind}/${login}`)).body
					.length,
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
				http.get<{ response: CatalogDto[typeof kind][] }>(`${path}/${kind}/catalog`),
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

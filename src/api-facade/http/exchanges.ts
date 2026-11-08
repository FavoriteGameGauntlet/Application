import type { AdminExchangeInput, Api, ExchangeOffer } from '../contracts'
import { http } from '../http'
import { type NamedChangeEntryDto, toResourceRef } from './changeEntry'
import { currentLogin, partyPath } from './context'
import { latestOwnEntry } from './journal'
import { resources } from './resources'
import { fromCostRow, fromGainRow } from './rows'

type ExchangeDto = {
	id: number
	name: string
	description: string
	sourceEntries: NamedChangeEntryDto[]
	targetEntries: NamedChangeEntryDto[]
}

type ExchangeOfferDto = ExchangeDto & {
	available: boolean
	unavailableReason?: ExchangeOffer['unavailableReason']
}

const toSides = (e: ExchangeDto) => ({
	sourceEntries: e.sourceEntries.map(toResourceRef),
	targetEntries: e.targetEntries.map(toResourceRef),
})

const toBody = ({
	name,
	description,
	sourceEntries,
	targetEntries,
}: AdminExchangeInput) => ({
	name,
	description,
	sourceEntries: sourceEntries.map(fromCostRow),
	targetEntries: targetEntries.map(fromGainRow),
})

export const exchanges: Api['exchanges'] = {
	list: async () =>
		(
			await http.get<{ response: ExchangeOfferDto[] }>(
				`${await partyPath()}/exchanges/catalog`,
			)
		).body.map((e) => ({ ...e, ...toSides(e) })),

	execute: async (id, targetLogins) => {
		await http.post(`${await partyPath()}/exchanges/catalog/${id}/use`, {
			body: targetLogins ? { targetLogins } : {},
		})

		return {
			resources: await resources.user(await currentLogin()),
			journalEntry: await latestOwnEntry(),
		}
	},
}

export const adminExchanges: Api['admin']['exchanges'] = {
	create: async (input) => {
		const exchange = (
			await http.post<{ response: ExchangeDto }>(
				`${await partyPath()}/exchanges/catalog`,
				{ body: toBody(input) },
			)
		).body

		return { ...exchange, ...toSides(exchange), deleted: false }
	},

	update: async (id, input) => {
		const exchange = (
			await http.patch<{ response: ExchangeDto }>(
				`${await partyPath()}/exchanges/catalog/${id}`,
				{ body: toBody(input) },
			)
		).body

		return { ...exchange, ...toSides(exchange), deleted: false }
	},

	restore: async (id) => {
		await http.post(`${await partyPath()}/exchanges/catalog/${id}/restore`)
	},

	list: async (includeDeleted) => {
		const path = await partyPath()
		const [active, removed] = await Promise.all([
			http.get<{ response: ExchangeDto[] }>(`${path}/exchanges/catalog`),
			includeDeleted
				? http.get<{ response: ExchangeDto[] }>(`${path}/exchanges/catalog/removed`)
				: undefined,
		])

		return [
			...active.body.map((e) => ({ ...e, ...toSides(e), deleted: false })),
			...(removed?.body ?? []).map((e) => ({ ...e, ...toSides(e), deleted: true })),
		]
	},

	remove: async (id) => {
		await http.delete(`${await partyPath()}/exchanges/catalog/${id}`)
	},
}

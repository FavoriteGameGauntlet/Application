import type { Api, ExchangeOffer } from '../contracts'
import { http } from '../http'
import { type NamedChangeEntryDto, toResourceRef } from './changeEntry'
import { partyPath } from './context'
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

export const exchanges: Pick<Api['exchanges'], 'list'> = {
	list: async () =>
		(
			await http.get<{ response: ExchangeOfferDto[] }>(
				`${await partyPath()}/exchanges/catalog`,
			)
		).body.map((e) => ({ ...e, ...toSides(e) })),
}

export const adminExchanges: Pick<
	Api['admin']['exchanges'],
	'list' | 'create' | 'remove'
> = {
	create: async ({ name, description, sourceEntries, targetEntries }) => {
		const exchange = (
			await http.post<{ response: ExchangeDto }>(
				`${await partyPath()}/exchanges/catalog`,
				{
					body: {
						name,
						description,
						sourceEntries: sourceEntries.map(fromCostRow),
						targetEntries: targetEntries.map(fromGainRow),
					},
				},
			)
		).body

		return { ...exchange, ...toSides(exchange), deleted: false }
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

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { ExchangeOffer, ExchangeUse } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { formatResource } from '../utils/formatResource'
import { useJournalStore } from './journalStore'
import { useResourcesStore } from './resourcesStore'
import { useToastStore } from './toastStore'

export const useExchangesStore = defineStore(StoreName.Exchanges, () => {
	const list = ref<ExchangeOffer[]>([])

	const load = async () => {
		list.value = await api.exchanges.list()
	}

	const execute = async (exchange: ExchangeOffer, use?: ExchangeUse) => {
		const toast = useToastStore()
		const resources = useResourcesStore()

		// a side that doesn't apply all its entries gives only the picked ones
		const received = use?.targetEntryIds
			? exchange.targetEntries.filter(
					(r) =>
						r.entryId !== undefined && use.targetEntryIds?.includes(r.entryId),
				)
			: exchange.targetEntries

		try {
			await api.exchanges.execute(exchange.id, use)

			toast.show(
				'Обмен проведён',
				received.map((r) => formatResource(r, resources.pointTypes)).join(', '),
			)

			await Promise.all([load(), resources.loadMine()])
			useJournalStore().bump()
		} catch (e) {
			toast.error(e)
		}
	}

	return { list, load, execute }
})

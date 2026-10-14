import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { Exchange } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { formatResource } from '../utils/formatResource'
import { useJournalStore } from './journalStore'
import { useResourcesStore } from './resourcesStore'
import { useToastStore } from './toastStore'

export const useExchangesStore = defineStore(StoreName.Exchanges, () => {
	const list = ref<Exchange[]>([])

	const load = async () => {
		list.value = await api.exchanges.list()
	}

	const execute = async (exchange: Exchange) => {
		const toast = useToastStore()
		const resources = useResourcesStore()

		try {
			await api.exchanges.execute(exchange.id)

			toast.show(
				'Обмен проведён',
				exchange.get.map((r) => formatResource(r, resources.pointTypes)).join(', '),
			)

			await Promise.all([load(), resources.loadMine()])
			useJournalStore().bump()
		} catch (e) {
			toast.error(e)
		}
	}

	return { list, load, execute }
})

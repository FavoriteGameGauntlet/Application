import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { Party } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'

export const usePartiesStore = defineStore(StoreName.Parties, () => {
	const list = ref<Party[]>([])

	const load = async () => {
		list.value = await api.parties.list()
	}

	const select = (party: Party) => api.parties.select(party.id)

	return { list, load, select }
})

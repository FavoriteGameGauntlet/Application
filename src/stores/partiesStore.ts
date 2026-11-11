import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	Party,
	PartyCreateInput,
	PartyInput,
} from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'

export const usePartiesStore = defineStore(StoreName.Parties, () => {
	const list = ref<Party[]>([])

	const load = async () => {
		list.value = await api.parties.list()
	}

	const select = (party: Party) => api.parties.select(party.id)

	const create = async (input: PartyCreateInput) => {
		await api.parties.create(input)
		await load()
	}

	const update = async (id: number, input: PartyInput) => {
		await api.parties.update(id, input)
		await load()
	}

	return { list, load, select, create, update }
})

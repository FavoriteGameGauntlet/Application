import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { JournalQuery } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'

export const useJournalStore = defineStore(StoreName.Journal, () => {
	/** changes after every action that writes to the journal, views refetch on it */
	const revision = ref(0)

	const bump = () => {
		revision.value++
	}

	const fetch = (query: JournalQuery) => api.journal.list(query)

	return { revision, bump, fetch }
})

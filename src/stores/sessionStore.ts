import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { Me, Season } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'

export const useSessionStore = defineStore(StoreName.Session, () => {
	const me = ref<Me>()
	const season = ref<Season>()

	const login = computed(() => me.value?.login ?? '')
	const isAdmin = computed(() => me.value?.isAdmin ?? false)

	const load = async () => {
		const [loadedMe, loadedSeason] = await Promise.all([
			api.session.getMe(),
			api.session.getSeason(),
		])

		me.value = loadedMe
		season.value = loadedSeason
	}

	return { me, season, login, isAdmin, load }
})

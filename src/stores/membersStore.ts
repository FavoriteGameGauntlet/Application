import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { Login, Member } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'

export const useMembersStore = defineStore(StoreName.Members, () => {
	const list = ref<Member[]>([])

	const players = computed(() => list.value.map((m) => m.player))

	const colorOf = (login: Login) => {
		const colorIndex = players.value.find((p) => p.login === login)?.colorIndex

		return `var(--player-${colorIndex ?? 1})`
	}

	const load = async () => {
		list.value = await api.members.list()
	}

	const get = (login: Login) => api.members.get(login)

	return { list, players, colorOf, load, get }
})

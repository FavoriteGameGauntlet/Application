import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { Login, Member } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'

export const useMembersStore = defineStore(StoreName.Members, () => {
	const list = ref<Member[]>([])

	const users = computed(() => list.value.map((m) => m.user))

	const colorOf = (login: Login) => {
		const colorIndex = users.value.find((p) => p.login === login)?.colorIndex

		return `var(--user-${colorIndex ?? 1})`
	}

	const load = async () => {
		list.value = await api.members.list()
	}

	const get = (login: Login) => api.members.get(login)

	return { list, users, colorOf, load, get }
})

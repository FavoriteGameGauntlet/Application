import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { Login, Member } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'

export const useMembersStore = defineStore(StoreName.Members, () => {
	const all = ref<Member[]>([])
	let loadId = 0

	const list = computed(() => all.value.filter((member) => !member.leftDate))

	const users = computed(() => list.value.map((m) => m.user))

	/** the avatar falls back to its default color for a login that is not in the party */
	const colorOf = (login: Login) =>
		users.value.find((p) => p.login === login)?.color ?? 'var(--user-1)'

	const avatarOf = (login: Login) =>
		all.value.find((member) => member.user.login === login)?.user.avatarUrl

	const load = async () => {
		const id = ++loadId
		const members = await api.members.list()

		if (id === loadId) all.value = members
	}

	const get = (login: Login) => api.members.get(login)

	return { list, users, colorOf, avatarOf, load, get }
})

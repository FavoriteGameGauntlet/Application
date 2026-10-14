import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { Login, WishlistGame } from '../api-facade/contracts'
import type { HttpErrorResponse } from '../api-facade/http'
import { StoreName } from '../enums/storeName'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'

export const useWishlistStore = defineStore(StoreName.Wishlist, () => {
	const lists = ref<Record<Login, WishlistGame[]>>({})

	const mine = computed(() => lists.value[useSessionStore().login] ?? [])

	const load = async (login: Login) => {
		lists.value[login] = await api.wishlist.list(login)
	}

	const loadMine = () => load(useSessionStore().login)

	/** @returns whether the game was added */
	const add = async (login: Login, name: string) => {
		const toast = useToastStore()
		const owner = login === useSessionStore().login ? '' : ` ${login}`

		try {
			const game = await api.wishlist.add(login, name)

			lists.value[login] = [...(lists.value[login] ?? []), game]
			toast.show(`Добавлено в вишлист${owner}`, name)
			return true
		} catch (e) {
			if ((e as HttpErrorResponse).body?.code === 'DUPLICATE') {
				toast.show(`Уже в вишлисте${owner}`, name, 'info')
			} else {
				toast.error(e)
			}

			return false
		}
	}

	const rename = async (id: string, name: string) => {
		try {
			const game = await api.wishlist.rename(id, name)

			lists.value[useSessionStore().login] = mine.value.map((g) =>
				g.id === id ? game : g,
			)
		} catch (e) {
			useToastStore().error(e)
		}
	}

	const remove = async (id: string, name: string) => {
		try {
			await api.wishlist.remove(id)

			lists.value[useSessionStore().login] = mine.value.filter(
				(g) => g.id !== id,
			)
			useToastStore().show('Удалено из вишлиста', name, 'info')
		} catch (e) {
			useToastStore().error(e)
		}
	}

	return { lists, mine, load, loadMine, add, rename, remove }
})

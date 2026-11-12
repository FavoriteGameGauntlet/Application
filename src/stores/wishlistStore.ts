import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { Login, WishlistEntry } from '../api-facade/contracts'
import type { HttpErrorResponse } from '../api-facade/http'
import { StoreName } from '../enums/storeName'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'

export const useWishlistStore = defineStore(StoreName.Wishlist, () => {
	const lists = ref<Record<Login, WishlistEntry[]>>({})

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
			toast.show(`Добавлено в список желаемого${owner}`, name)
			return true
		} catch (e) {
			const code = (e as HttpErrorResponse).body?.code

			if (code === 'WISHLIST_GAME_ALREADY_EXISTS') {
				toast.show(`Уже в списке желаемого${owner}`, name, 'info')
			} else if (code === 'GAME_ALREADY_PICKED') {
				toast.show(`Игру уже выбирали${owner}`, name, 'info')
			} else {
				toast.error(e)
			}

			return false
		}
	}

	const rename = async (id: number, name: string) => {
		try {
			const game = await api.wishlist.rename(id, name)

			lists.value[useSessionStore().login] = mine.value.map((g) =>
				g.id === id ? game : g,
			)
		} catch (e) {
			useToastStore().error(e)
		}
	}

	const remove = async (id: number, name: string) => {
		try {
			await api.wishlist.remove(id)

			lists.value[useSessionStore().login] = mine.value.filter(
				(g) => g.id !== id,
			)
			useToastStore().show('Удалено из списка желаемого', name, 'info')
		} catch (e) {
			useToastStore().error(e)
		}
	}

	return { lists, mine, load, loadMine, add, rename, remove }
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	Login,
	RemovedWishlistEntry,
	WishlistEntry,
} from '../api-facade/contracts'
import type { HttpErrorResponse } from '../api-facade/http'
import { StoreName } from '../enums/storeName'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'

export const useWishlistStore = defineStore(StoreName.Wishlist, () => {
	const lists = ref<Record<Login, WishlistEntry[]>>({})

	/** the entries that left the current user's wishlist; only the `removed` ones can be restored */
	const removed = ref<RemovedWishlistEntry[]>([])

	const mine = computed(() => lists.value[useSessionStore().login] ?? [])

	const load = async (login: Login) => {
		lists.value[login] = await api.wishlist.list(login)
	}

	const loadMine = () => load(useSessionStore().login)

	/**
	 * A refusal that the user fixes in the name they typed comes back to the form
	 * instead of a toast.
	 */
	const add = async (
		login: Login,
		name: string,
	): Promise<'added' | 'exists' | 'picked' | 'failed'> => {
		const toast = useToastStore()
		const owner = login === useSessionStore().login ? '' : ` ${login}`

		try {
			const game = await api.wishlist.add(login, name)

			lists.value[login] = [...(lists.value[login] ?? []), game]
			toast.show(`Добавлено в список желаемого${owner}`, name)
			return 'added'
		} catch (e) {
			const code = (e as HttpErrorResponse).body?.code

			if (code === 'WISHLIST_GAME_ALREADY_EXISTS') return 'exists'
			if (code === 'GAME_ALREADY_PICKED') return 'picked'

			toast.error(e)
			return 'failed'
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

	const remove = async (game: WishlistEntry) => {
		try {
			await api.wishlist.remove(game.id)

			lists.value[useSessionStore().login] = mine.value.filter(
				(g) => g.id !== game.id,
			)
			removed.value = [...removed.value, { ...game, removalKind: 'removed' }]
			useToastStore().show(
				'Игра убрана из списка желаемого и с колеса',
				game.name,
				'info',
			)
		} catch (e) {
			useToastStore().error(e)
		}
	}

	const loadRemoved = async () => {
		removed.value = await api.wishlist.listRemoved()
	}

	const restore = async (game: WishlistEntry) => {
		const toast = useToastStore()

		try {
			await api.wishlist.restore(game.id)
			toast.show('Игра вернулась в список желаемого', game.name)
			await Promise.all([loadMine(), loadRemoved()])
		} catch (e) {
			toast.error(e)
		}
	}

	return {
		lists,
		mine,
		removed,
		load,
		loadMine,
		loadRemoved,
		add,
		rename,
		remove,
		restore,
	}
})

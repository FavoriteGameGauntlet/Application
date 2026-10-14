import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { CompletedGame, Login, Review } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'

export const useCompletedStore = defineStore(StoreName.Completed, () => {
	const lists = ref<Record<Login, CompletedGame[]>>({})

	const load = async (login: Login) => {
		lists.value[login] = await api.completed.list(login)
	}

	const loadMine = () => load(useSessionStore().login)

	const saveReview = async (game: CompletedGame, review: Review) => {
		const toast = useToastStore()

		try {
			await api.completed.saveReview(game.id, review)
			await loadMine()
			toast.show('Отзыв сохранён', `${game.name}: ${review.rating} / 10`)
		} catch (e) {
			toast.error(e)
		}
	}

	return { lists, load, loadMine, saveReview }
})

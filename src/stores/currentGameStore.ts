import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { CurrentGame } from '../api-facade/contracts'
import type { HttpErrorResponse } from '../api-facade/http'
import { StoreName } from '../enums/storeName'
import { useCompletedStore } from './completedStore'
import { useJournalStore } from './journalStore'
import { useMembersStore } from './membersStore'
import { useResourcesStore } from './resourcesStore'
import { useTimerStore } from './timerStore'
import { useToastStore } from './toastStore'
import { useWheelStore } from './wheelStore'

export const useCurrentGameStore = defineStore(StoreName.CurrentGame, () => {
	const current = ref<CurrentGame>()

	const load = async () => {
		current.value = await api.currentGame.get()
	}

	/** everything that depends on which game is being played */
	const reloadDependants = () =>
		Promise.all([
			load(),
			useTimerStore().load(),
			useMembersStore().load(),
			useCompletedStore().loadMine(),
		])

	const complete = async () => {
		const toast = useToastStore()
		const name = current.value?.game?.name

		try {
			const { journalEntry } = await api.currentGame.complete()
			const granted = journalEntry.changes.map((c) => c.text).join(', ')

			toast.show('Пройдено!', `${name}: ${granted}.`)

			await Promise.all([
				reloadDependants(),
				useResourcesStore().loadMine(),
			])
			useJournalStore().bump()
		} catch (e) {
			toast.error(e)
		}
	}

	const cancel = async () => {
		const toast = useToastStore()
		const name = current.value?.game?.name

		try {
			await api.currentGame.cancel()
			toast.show('Игра отменена', name, 'info')
			await reloadDependants()
		} catch (e) {
			toast.error(e)
		}
	}

	const reroll = async () => {
		const toast = useToastStore()

		try {
			const spin = await api.currentGame.reroll()

			await Promise.all([reloadDependants(), useWheelStore().playSpin(spin)])
		} catch (e) {
			if ((e as HttpErrorResponse).body?.code === 'WISHLIST_EMPTY') {
				toast.show('Вишлист пуст', 'Перекручивать не из чего.', 'danger')
			} else {
				toast.error(e)
			}
		}
	}

	return { current, load, reloadDependants, complete, cancel, reroll }
})

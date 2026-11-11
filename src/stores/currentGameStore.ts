import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { CurrentGame } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useCompletedStore } from './completedStore'
import { useJournalStore } from './journalStore'
import { useMembersStore } from './membersStore'
import { useResourcesStore } from './resourcesStore'
import { useTimerStore } from './timerStore'
import { useToastStore } from './toastStore'
import { useWheelStore } from './wheelStore'

/** the backend grants the party's reward for the end of a game a moment after it answers */
const REWARD_DELAY_MS = 1500

export const useCurrentGameStore = defineStore(StoreName.CurrentGame, () => {
	const current = ref<CurrentGame>()

	const load = async () => {
		current.value = await api.currentGame.get()

		// the timer belongs to the game: it is read after the game is known, and only when there is one
		if (current.value.game) await useTimerStore().load()
		else useTimerStore().clear()
	}

	/** everything that depends on which game is being played */
	const reloadDependants = () =>
		Promise.all([
			load(),
			useMembersStore().load(),
			useCompletedStore().loadMine(),
		])

	/** reads the resources and the journal again once the reward of the action has arrived */
	const refreshAfterReward = () => {
		setTimeout(async () => {
			try {
				await useResourcesStore().loadMine()
				useJournalStore().bump()
			} catch (e) {
				useToastStore().error(e)
			}
		}, REWARD_DELAY_MS)
	}

	const complete = async () => {
		const toast = useToastStore()
		const name = current.value?.game?.name
		// the reward comes after the answer, so the toast names what the party has set
		const reward = (current.value?.completionReward ?? [])
			.map((r) => `${r.value} ${r.label}`)
			.join(', ')

		try {
			await api.currentGame.complete()

			toast.show('Пройдено!', reward ? `${name}: ${reward}.` : `${name}.`)

			await Promise.all([reloadDependants(), useResourcesStore().loadMine()])
			useJournalStore().bump()
			refreshAfterReward()
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
			refreshAfterReward()
		} catch (e) {
			toast.error(e)
		}
	}

	/** cancels the game with the status «rerolled», then a new game is spun */
	const reroll = async () => {
		const toast = useToastStore()

		try {
			await api.currentGame.reroll()
			await reloadDependants()
			refreshAfterReward()
			await useWheelStore().spinGames()
		} catch (e) {
			toast.error(e)
		}
	}

	return { current, load, reloadDependants, complete, cancel, reroll }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { JournalEntry, Login, ManualChange } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { router } from '../router/router'
import { RouteName } from '../router/routeNames'
import { plural } from '../utils/plural'
import { useJournalStore } from './journalStore'
import { useMembersStore } from './membersStore'
import { useResourcesStore } from './resourcesStore'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'

type FixDraft = {
	kind: 'fix'
	entry: JournalEntry
	/** the user whose resources are shown first */
	user: Login
}

type WheelDraft = {
	kind: 'wheel'
	spinId: number
	name: string
	group: string
	description: string
}

/** what the manual change form is opened for */
export type ManualDraft = FixDraft | WheelDraft

export const useManualStore = defineStore(StoreName.Manual, () => {
	const draft = ref<ManualDraft | null>(null)

	const startFix = async (entry: JournalEntry) => {
		const logins = useMembersStore().users.map((p) => p.login)
		const actor = logins.includes(entry.actor) ? entry.actor : undefined
		const affected = entry.changes.find((c) => c.login && logins.includes(c.login))?.login

		draft.value = {
			kind: 'fix',
			entry,
			user: actor ?? affected ?? useSessionStore().login,
		}

		await router.push({ name: RouteName.Manual })
	}

	const startWheel = async (spin: Omit<WheelDraft, 'kind'>) => {
		draft.value = { kind: 'wheel', ...spin }

		await router.push({ name: RouteName.Manual })
	}

	/** goes back to where the form was opened from */
	const close = async () => {
		const kind = draft.value?.kind

		draft.value = null

		await (kind === 'fix'
			? router.push({ name: RouteName.Resources, params: { tab: 'history' } })
			: router.push({ name: RouteName.Wheel }))
	}

	const apply = async (changes: ManualChange[]) => {
		const current = draft.value
		const toast = useToastStore()

		if (!current) return

		try {
			await api.manual.apply({
				changes,
				...(current.kind === 'fix'
					? { correctsEntryId: current.entry.id }
					: { spinId: current.spinId }),
			})

			toast.show(
				current.kind === 'fix' ? 'Исправление записано' : 'Применено',
				`${changes.length} ${plural(changes.length, ['изменение', 'изменения', 'изменений'])} в журнале.`,
			)

			await useResourcesStore().loadMine()
			useJournalStore().bump()
			await close()
		} catch (e) {
			toast.error(e)
		}
	}

	return { draft, startFix, startWheel, close, apply }
})

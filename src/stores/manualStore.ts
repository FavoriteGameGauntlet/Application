import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { JournalEntry, Login, ManualChange } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { router } from '../router/router'
import { RouteName } from '../router/routeNames'
import { plural } from '../utils/plural'
import { useJournalStore } from './journalStore'
import { useMembersStore } from './membersStore'
import { useParametersStore } from './parametersStore'
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
	name: string
	group: string
	description: string
}

/** the holder used an item or the ability of a perk that is followed by a manual change */
type UseDraft = {
	kind: 'use'
	/** the tab of the resources the form goes back to */
	source: 'items' | 'perks'
	name: string
	description: string
}

/** a member changes resources with no reason from the wheel or the journal */
type FreeDraft = {
	kind: 'free'
}

/** what the manual change form is opened for */
export type ManualDraft = FixDraft | WheelDraft | UseDraft | FreeDraft

export const useManualStore = defineStore(StoreName.Manual, () => {
	const draft = ref<ManualDraft | null>(null)
	const canAccess = computed(
		() =>
			useSessionStore().isAdmin ||
			useParametersStore().parameters.some(
				(p) => p.code === 'GrantsAdminOnly' && p.value === 'false',
			),
	)

	const startFix = async (entry: JournalEntry) => {
		if (!canAccess.value) return

		const logins = useMembersStore().users.map((p) => p.login)
		const actor = logins.includes(entry.actor) ? entry.actor : undefined
		const affected = entry.changes.find(
			(c) => c.login && logins.includes(c.login),
		)?.login

		draft.value = {
			kind: 'fix',
			entry,
			user: actor ?? affected ?? useSessionStore().login,
		}

		await router.push({ name: RouteName.Manual })
	}

	const startWheel = async (spin: Omit<WheelDraft, 'kind'>) => {
		if (!canAccess.value) return

		draft.value = { kind: 'wheel', ...spin }

		await router.push({ name: RouteName.Manual })
	}

	const startUse = async (use: Omit<UseDraft, 'kind'>) => {
		if (!canAccess.value) return

		draft.value = { kind: 'use', ...use }

		await router.push({ name: RouteName.Manual })
	}

	const startFree = async () => {
		if (!canAccess.value) return

		draft.value = { kind: 'free' }

		await router.push({ name: RouteName.Manual })
	}

	/** goes back to where the form was opened from */
	const close = async () => {
		const current = draft.value

		draft.value = null

		switch (current?.kind) {
			case 'fix':
				await router.push({
					name: RouteName.Resources,
					params: { tab: 'history' },
				})
				break
			case 'use':
				await router.push({
					name: RouteName.Resources,
					params: { tab: current.source },
				})
				break
			case 'free':
				await router.push({ name: RouteName.Home })
				break
			default:
				await router.push({ name: RouteName.Wheel })
		}
	}

	const apply = async (changes: ManualChange[]) => {
		const current = draft.value
		const toast = useToastStore()

		if (!current || !canAccess.value) return

		try {
			await api.manual.apply({
				changes,
				...(current.kind === 'fix' && { correctsEntryId: current.entry.id }),
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

	return {
		draft,
		canAccess,
		startFix,
		startWheel,
		startUse,
		startFree,
		close,
		apply,
	}
})

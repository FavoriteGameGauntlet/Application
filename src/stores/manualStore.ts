import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '../api-facade/api'
import type { JournalEntry, Login, ManualChange } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { router } from '../router/router'
import { RouteName } from '../router/routeNames'
import { plural } from '../utils/plural'
import { useAuthStore } from './authStore'
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

type EffectEndDraft = {
	kind: 'effect-end'
	entry: JournalEntry
	changeIndex: number
	user: Login
	name: string
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

export type ManualRow = {
	who: Login
	type: ManualChange['kind']
	resId: string
	act: string
	n: string
}

type ManualSource =
	| FixDraft
	| WheelDraft
	| UseDraft
	| FreeDraft
	| EffectEndDraft

/** Keep incomplete input as text so navigation preserves exactly what was entered. */
export type ManualDraft = ManualSource & {
	rows: ManualRow[]
	panelUser: Login
}

export const useManualStore = defineStore(StoreName.Manual, () => {
	const draft = ref<ManualDraft | null>(null)
	const replacing = ref(false)
	let replacementAnswer: ((accepted: boolean) => void) | undefined
	const canAccess = computed(
		() =>
			useSessionStore().isAdmin ||
			useParametersStore().parameters.some(
				(p) => p.code === 'GrantsAdminOnly' && p.value === 'false',
			),
	)

	const resolveReplacement = (accepted: boolean) => {
		const answer = replacementAnswer
		replacementAnswer = undefined
		replacing.value = false
		answer?.(accepted)
	}

	const confirmReplacement = () => {
		if (!draft.value) return Promise.resolve(true)
		if (replacing.value) return Promise.resolve(false)

		replacing.value = true
		return new Promise<boolean>((resolve) => {
			replacementAnswer = resolve
		})
	}

	const newRow = (who: Login): ManualRow => ({
		who,
		type: 'points',
		resId: String(useResourcesStore().personalTypes[0]?.id ?? ''),
		act: 'plus',
		n: '',
	})

	const setDraft = (source: ManualSource) => {
		const user =
			source.kind === 'fix' || source.kind === 'effect-end'
				? source.user
				: useSessionStore().login
		draft.value = {
			...source,
			rows: source.kind === 'fix' ? [] : [newRow(user)],
			panelUser: user,
		}
	}

	watch(
		[() => useSessionStore().season?.id, () => useAuthStore().login],
		() => {
			draft.value = null
			resolveReplacement(false)
		},
		{ flush: 'sync' },
	)

	const startFix = async (entry: JournalEntry) => {
		if (!canAccess.value) return
		if (draft.value?.kind === 'fix' && draft.value.entry.id === entry.id) {
			await router.push({ name: RouteName.Manual })
			return
		}
		if (!(await confirmReplacement())) return

		const logins = useMembersStore().users.map((p) => p.login)
		const actor = logins.includes(entry.actor) ? entry.actor : undefined
		const affected = entry.changes.find(
			(c) => c.login && logins.includes(c.login),
		)?.login

		setDraft({
			kind: 'fix',
			entry,
			user: actor ?? affected ?? useSessionStore().login,
		})

		await router.push({ name: RouteName.Manual })
	}

	const startEffectEnd = async (entry: JournalEntry, changeIndex: number) => {
		const change = entry.changes[changeIndex]
		if (
			!canAccess.value ||
			!change?.isManualChange ||
			!change.login ||
			change.resource?.kind !== 'effect'
		)
			return
		if (
			draft.value?.kind === 'effect-end' &&
			draft.value.entry.id === entry.id &&
			draft.value.changeIndex === changeIndex
		) {
			await router.push({ name: RouteName.Manual })
			return
		}
		if (!(await confirmReplacement()) || !canAccess.value) return

		setDraft({
			kind: 'effect-end',
			entry,
			changeIndex,
			user: change.login,
			name: change.resource.name,
		})
		await router.push({ name: RouteName.Manual })
	}

	const startWheel = async (spin: Omit<WheelDraft, 'kind'>) => {
		if (!canAccess.value) return

		setDraft({ kind: 'wheel', ...spin })

		await router.push({ name: RouteName.Manual })
	}

	const startUse = async (use: Omit<UseDraft, 'kind'>) => {
		if (!canAccess.value) return

		setDraft({ kind: 'use', ...use })

		await router.push({ name: RouteName.Manual })
	}

	const startFree = async () => {
		if (!canAccess.value) return

		if (!draft.value) setDraft({ kind: 'free' })

		await router.push({ name: RouteName.Manual })
	}

	/** goes back to where the form was opened from */
	const close = async (discard = true) => {
		const current = draft.value

		if (discard) draft.value = null

		switch (current?.kind) {
			case 'fix':
			case 'effect-end':
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

			await close()
			await useResourcesStore().loadMine()
			useJournalStore().bump()
		} catch (e) {
			toast.error(e)
		}
	}

	return {
		draft,
		canAccess,
		replacing,
		confirmReplacement,
		resolveReplacement,
		newRow,
		startFix,
		startEffectEnd,
		startWheel,
		startUse,
		startFree,
		close,
		apply,
	}
})

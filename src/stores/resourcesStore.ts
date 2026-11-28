import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	CatalogEntry,
	CatalogOption,
	Effect,
	ItemUse,
	Login,
	Perk,
	UserItem,
	UserResources,
	PointsStanding,
	PointType,
	ResourceKind,
	ResourceSummary,
} from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useJournalStore } from './journalStore'
import { useManualStore } from './manualStore'
import { useParametersStore } from './parametersStore'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'

export const useResourcesStore = defineStore(StoreName.Resources, () => {
	/** both personal and shared types */
	const pointTypes = ref<PointType[]>([])
	const personalTypes = computed(() =>
		pointTypes.value.filter((t) => !t.isShared),
	)
	const sharedTypes = computed(() => pointTypes.value.filter((t) => t.isShared))
	/** by the id of the shared point type */
	const sharedPoints = ref<Record<number, number>>({})
	const byUser = ref<Record<Login, UserResources>>({})
	const standings = ref<PointsStanding[]>([])
	const summaries = ref<Partial<Record<ResourceKind, ResourceSummary[]>>>({})
	const catalogs = ref<Partial<Record<ResourceKind, CatalogOption[]>>>({})
	const catalogEntries = ref<Partial<Record<ResourceKind, CatalogEntry[]>>>({})
	const endingEffect = ref(false)

	const canEndEffect = (login: Login) => {
		const parameters = useParametersStore()
		const session = useSessionStore()

		return (
			parameters.isOn('EffectEndByHandEnabled') &&
			(login === session.login ||
				session.isAdmin ||
				parameters.parameters.some(
					(p) => p.code === 'ActingForOthersAdminOnly' && p.value === 'false',
				))
		)
	}

	const loadPointTypes = async () => {
		pointTypes.value = await api.resources.pointTypes()
	}

	const loadSharedPoints = async () => {
		sharedPoints.value = await api.resources.sharedPoints()
	}

	const loadUser = async (login: Login) => {
		byUser.value[login] = await api.resources.user(login)
	}

	const loadMine = () => loadUser(useSessionStore().login)

	const loadStandings = async () => {
		standings.value = await api.resources.standings()
	}

	const loadSummary = async (kind: ResourceKind) => {
		summaries.value[kind] = await api.resources.summary(kind)
	}

	const loadCatalog = async (kind: ResourceKind) => {
		catalogs.value[kind] = await api.resources.catalog(kind)
	}

	const loadCatalogEntries = async (kind: ResourceKind) => {
		catalogEntries.value[kind] = await api.resources.catalogEntries(kind)
	}

	/** the kinds asked for by `catalogEntryOf`, so a kind is read once */
	const requestedEntries = new Set<ResourceKind>()

	/**
	 * The catalogue entry of a point type, an item, a perk or an effect, for its card.
	 * The first call for a kind reads that catalogue, so it answers undefined until then.
	 */
	const catalogEntryOf = (
		kind: 'points' | ResourceKind,
		id: number,
	): CatalogEntry | undefined => {
		if (kind === 'points') {
			const type = pointTypes.value.find((t) => t.id === id)

			return type && { ...type, deleted: false }
		}

		if (!catalogEntries.value[kind] && !requestedEntries.has(kind)) {
			requestedEntries.add(kind)
			loadCatalogEntries(kind).catch(() => requestedEntries.delete(kind))
		}

		return catalogEntries.value[kind]?.find((e) => e.id === id)
	}

	const fetchHistory = (login: Login, kind: ResourceKind, id: number) =>
		api.resources.history(login, kind, id, 4)

	const useItem = async (item: UserItem, use?: ItemUse) => {
		const toast = useToastStore()

		try {
			if (
				item.isManualChange &&
				useManualStore().canAccess &&
				!(await useManualStore().confirmReplacement())
			)
				return

			await api.resources.useItem(item.id, use)
			await loadMine()
			useJournalStore().bump()

			if (item.isManualChange) {
				await useManualStore().startUse({
					source: 'items',
					name: item.name,
					description: item.description,
				})
			} else {
				toast.show('Использован предмет', item.name)
			}
		} catch (e) {
			toast.error(e)
		}
	}

	const usePerk = async (perk: Perk, use?: ItemUse) => {
		const toast = useToastStore()

		try {
			if (
				perk.abilityIsManualChange &&
				useManualStore().canAccess &&
				!(await useManualStore().confirmReplacement())
			)
				return

			await api.resources.usePerk(perk.id, use)
			await loadMine()
			useJournalStore().bump()

			if (perk.abilityIsManualChange) {
				await useManualStore().startUse({
					source: 'perks',
					name: perk.name,
					description: perk.description,
				})
			} else {
				toast.show('Перк использован', perk.name)
			}
		} catch (e) {
			toast.error(e)
		}
	}

	const endEffect = async (login: Login, effect: Effect) => {
		if (endingEffect.value || !canEndEffect(login)) return

		endingEffect.value = true
		const session = useSessionStore()
		const { me, season } = session
		const refresh = async () => {
			useJournalStore().bump()
			await Promise.all([loadUser(login), loadSharedPoints()])
		}

		try {
			await api.resources.endEffect(login, effect.id)
			useToastStore().show('Эффект завершён', effect.name)
			await refresh()

			// Completion changes arrive through the event bus after the removal response.
			await new Promise((resolve) => setTimeout(resolve, 1500))
			if (session.me === me && session.season === season) await refresh()
		} catch (e) {
			useToastStore().error(e)
		} finally {
			endingEffect.value = false
		}
	}

	return {
		pointTypes,
		personalTypes,
		sharedTypes,
		sharedPoints,
		byUser,
		standings,
		summaries,
		catalogs,
		catalogEntries,
		loadPointTypes,
		loadSharedPoints,
		loadUser,
		loadMine,
		loadStandings,
		loadSummary,
		loadCatalog,
		loadCatalogEntries,
		catalogEntryOf,
		fetchHistory,
		useItem,
		usePerk,
		canEndEffect,
		endingEffect,
		endEffect,
	}
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	CatalogEntry,
	CatalogOption,
	ItemUse,
	Login,
	UserResources,
	PointsStanding,
	PointType,
	ResourceKind,
	ResourceSummary,
} from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useJournalStore } from './journalStore'
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

	const fetchHistory = (login: Login, kind: ResourceKind, id: number) =>
		api.resources.history(login, kind, id, 4)

	const useItem = async (item: { id: number; name: string }, use?: ItemUse) => {
		const toast = useToastStore()

		try {
			await api.resources.useItem(item.id, use)
			toast.show('Использован предмет', item.name)
			await loadMine()
			useJournalStore().bump()
		} catch (e) {
			toast.error(e)
		}
	}

	const usePerk = async (perkId: number, name: string, use?: ItemUse) => {
		const toast = useToastStore()

		try {
			await api.resources.usePerk(perkId, use)
			toast.show('Перк использован', name)
			await loadMine()
			useJournalStore().bump()
		} catch (e) {
			toast.error(e)
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
		fetchHistory,
		useItem,
		usePerk,
	}
})

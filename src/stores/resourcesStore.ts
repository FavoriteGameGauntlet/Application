import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	CatalogOption,
	Login,
	UserResources,
	PointsLeaderboard,
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
	const personalTypes = computed(() => pointTypes.value.filter((t) => !t.isShared))
	const sharedTypes = computed(() => pointTypes.value.filter((t) => t.isShared))
	/** by the id of the shared point type */
	const sharedPoints = ref<Record<number, number>>({})
	const byUser = ref<Record<Login, UserResources>>({})
	const leaderboards = ref<Record<number, PointsLeaderboard>>({})
	const summaries = ref<Partial<Record<ResourceKind, ResourceSummary[]>>>({})
	const catalogs = ref<Partial<Record<ResourceKind, CatalogOption[]>>>({})

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

	const loadLeaderboard = async (typeId: number) => {
		leaderboards.value[typeId] = await api.resources.leaderboard(typeId)
	}

	const loadSummary = async (kind: ResourceKind) => {
		summaries.value[kind] = await api.resources.summary(kind)
	}

	const loadCatalog = async (kind: ResourceKind) => {
		catalogs.value[kind] = await api.resources.catalog(kind)
	}

	const fetchHistory =(login: Login, kind: ResourceKind, id: number) =>
		api.resources.history(login, kind, id, 4)

	const useItem = async (item: { id: number; name: string }) => {
		const toast = useToastStore()

		try {
			await api.resources.useItem(item.id)
			toast.show('Использован предмет', item.name)
			await loadMine()
			useJournalStore().bump()
		} catch (e) {
			toast.error(e)
		}
	}

	const usePerk = async (perkId: number, effectName: string) => {
		const toast = useToastStore()

		try {
			await api.resources.usePerk(perkId)
			toast.show('Эффект перка использован', effectName)
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
		leaderboards,
		summaries,
		catalogs,
		loadPointTypes,
		loadSharedPoints,
		loadUser,
		loadMine,
		loadLeaderboard,
		loadSummary,
		loadCatalog,
		fetchHistory,
		useItem,
		usePerk,
	}
})

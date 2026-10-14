import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	Login,
	PlayerResources,
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
	const pointTypes = ref<PointType[]>([])
	const byPlayer = ref<Record<Login, PlayerResources>>({})
	const leaderboards = ref<Record<number, PointsLeaderboard>>({})
	const summaries = ref<Partial<Record<ResourceKind, ResourceSummary[]>>>({})

	const loadPointTypes = async () => {
		pointTypes.value = await api.resources.pointTypes()
	}

	const loadPlayer = async (login: Login) => {
		byPlayer.value[login] = await api.resources.player(login)
	}

	const loadMine = () => loadPlayer(useSessionStore().login)

	const loadLeaderboard = async (typeId: number) => {
		leaderboards.value[typeId] = await api.resources.leaderboard(typeId)
	}

	const loadSummary = async (kind: ResourceKind) => {
		summaries.value[kind] = await api.resources.summary(kind)
	}

	const fetchHistory = (login: Login, kind: ResourceKind, id: number) =>
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
		byPlayer,
		leaderboards,
		summaries,
		loadPointTypes,
		loadPlayer,
		loadMine,
		loadLeaderboard,
		loadSummary,
		fetchHistory,
		useItem,
		usePerk,
	}
})

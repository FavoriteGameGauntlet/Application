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
	const leaderboards = ref<Record<string, PointsLeaderboard>>({})
	const summaries = ref<Partial<Record<ResourceKind, ResourceSummary[]>>>({})

	const loadPointTypes = async () => {
		pointTypes.value = await api.resources.pointTypes()
	}

	const loadPlayer = async (login: Login) => {
		byPlayer.value[login] = await api.resources.player(login)
	}

	const loadMine = () => loadPlayer(useSessionStore().login)

	const loadLeaderboard = async (type: string) => {
		leaderboards.value[type] = await api.resources.leaderboard(type)
	}

	const loadSummary = async (kind: ResourceKind) => {
		summaries.value[kind] = await api.resources.summary(kind)
	}

	const fetchHistory = (login: Login, kind: ResourceKind, name: string) =>
		api.resources.history(login, kind, name, 4)

	const useItem = async (name: string, target?: Login) => {
		const toast = useToastStore()

		try {
			await api.resources.useItem(name, target)
			toast.show('Использован предмет', target ? `${name} → ${target}` : name)
			await loadMine()
			useJournalStore().bump()
		} catch (e) {
			toast.error(e)
		}
	}

	const usePerk = async (name: string, effectName: string) => {
		const toast = useToastStore()

		try {
			await api.resources.usePerk(name)
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

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	AdminExchange,
	CatalogEntry,
	CatalogEntryInput,
	CatalogKind,
} from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useResourcesStore } from './resourcesStore'
import { useToastStore } from './toastStore'

export const useAdminCatalogStore = defineStore(StoreName.AdminCatalog, () => {
	const entries = ref<CatalogEntry[]>([])
	/** the kind that `entries` belong to, they must not be shown for another one */
	const entriesKind = ref<CatalogKind>()
	const exchanges = ref<AdminExchange[]>([])
	/** the switch «Показать удалённые» of the open list */
	const showDeleted = ref(false)

	const fetchCatalog = (kind: CatalogKind, includeDeleted = false) =>
		api.admin.catalog.list(kind, includeDeleted)

	let lastRequest = 0

	const loadCatalog = async (kind: CatalogKind) => {
		const request = ++lastRequest
		const list = await fetchCatalog(kind, showDeleted.value)

		// a slower answer for the kind that was left must not replace the open one
		if (request !== lastRequest) return

		entries.value = list
		entriesKind.value = kind
	}

	const loadExchanges = async () => {
		exchanges.value = await api.admin.exchanges.list(showDeleted.value)
	}

	/** the user screens show the catalog too, so they are refreshed */
	const refreshUserData = (kind: CatalogKind) =>
		kind === 'point-types' ? useResourcesStore().loadPointTypes() : undefined

	const saveEntry = async (
		kind: CatalogKind,
		id: number | undefined,
		input: CatalogEntryInput,
	) => {
		const toast = useToastStore()

		try {
			if (id === undefined) {
				await api.admin.catalog.create(kind, input)
			} else {
				await api.admin.catalog.update(kind, id, input)
			}

			toast.show(id === undefined ? 'Добавлено' : 'Сохранено', input.name)

			await Promise.all([loadCatalog(kind), refreshUserData(kind)])
			return true
		} catch (e) {
			toast.error(e)
			return false
		}
	}

	const setDeleted = async (kind: CatalogKind, entry: CatalogEntry, deleted: boolean) => {
		const toast = useToastStore()

		try {
			if (deleted) {
				await api.admin.catalog.remove(kind, entry.id)
			} else {
				await api.admin.catalog.restore(kind, entry.id)
			}

			toast.show(
				deleted ? 'Удалено' : 'Возвращено',
				deleted ? `${entry.name}: скрыто у игроков, история сохранится.` : entry.name,
				deleted ? 'info' : 'success',
			)

			await Promise.all([loadCatalog(kind), refreshUserData(kind)])
		} catch (e) {
			toast.error(e)
		}
	}

	const saveExchange = async (
		id: number | undefined,
		input: { name: string; description: string },
	) => {
		const toast = useToastStore()

		try {
			if (id === undefined) {
				await api.admin.exchanges.create(input)
			} else {
				await api.admin.exchanges.update(id, input)
			}

			toast.show(id === undefined ? 'Добавлено' : 'Сохранено', input.name)

			await loadExchanges()
			return true
		} catch (e) {
			toast.error(e)
			return false
		}
	}

	const setExchangeDeleted = async (exchange: AdminExchange, deleted: boolean) => {
		const toast = useToastStore()

		try {
			if (deleted) {
				await api.admin.exchanges.remove(exchange.id)
			} else {
				await api.admin.exchanges.restore(exchange.id)
			}

			toast.show(
				deleted ? 'Обмен удалён' : 'Обмен возвращён',
				exchange.name,
				deleted ? 'info' : 'success',
			)

			await loadExchanges()
		} catch (e) {
			toast.error(e)
		}
	}

	return {
		entries,
		entriesKind,
		exchanges,
		showDeleted,
		fetchCatalog,
		loadCatalog,
		loadExchanges,
		saveEntry,
		setDeleted,
		saveExchange,
		setExchangeDeleted,
	}
})

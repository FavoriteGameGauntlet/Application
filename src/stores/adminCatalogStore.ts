import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	AdminExchange,
	AdminExchangeInput,
	CatalogEntry,
	CatalogEntryInput,
	CatalogKind,
	CatalogOption,
	ChangeRow,
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

	/** what a row of a change can name, by the kind of the resource */
	const targets = ref<Record<ChangeRow['kind'], CatalogOption[]>>({
		points: [],
		item: [],
		perk: [],
		effect: [],
	})
	const targetsLoaded = ref(false)

	/** the lists are read once and again after the catalogue is changed */
	const loadTargets = async () => {
		if (targetsLoaded.value) return

		const [items, perks, effects] = await Promise.all([
			api.resources.catalog('items'),
			api.resources.catalog('perks'),
			api.resources.catalog('effects'),
		])

		targets.value = {
			points: useResourcesStore().pointTypes.map(({ id, name }) => ({ id, name })),
			item: items,
			perk: perks,
			effect: effects,
		}
		targetsLoaded.value = true
	}

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

			targetsLoaded.value = false
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
			targetsLoaded.value = false

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

	const saveExchange = async (id: number | undefined, input: AdminExchangeInput) => {
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
		targets,
		loadTargets,
		fetchCatalog,
		loadCatalog,
		loadExchanges,
		saveEntry,
		setDeleted,
		saveExchange,
		setExchangeDeleted,
	}
})

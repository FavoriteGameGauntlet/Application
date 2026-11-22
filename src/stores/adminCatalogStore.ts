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
	/** a kind is read when its page opens; undefined until it is read */
	const lists = ref<Partial<Record<CatalogKind, CatalogEntry[]>>>({})
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
	/** the actual exchanges a perk trigger on «Обмен» can name */
	const exchangeOptions = ref<CatalogOption[]>([])
	/** the read in flight, so the editors of one form share it */
	let targetsRequest: Promise<void> | undefined

	/** read on each opening of a form: another admin may have changed the catalogue meanwhile */
	const loadTargets = () =>
		(targetsRequest ??= readTargets().finally(() => {
			targetsRequest = undefined
		}))

	const readTargets = async () => {
		const resources = useResourcesStore()

		const [items, perks, effects, offers] = await Promise.all([
			api.resources.catalog('items'),
			api.resources.catalog('perks'),
			api.resources.catalog('effects'),
			api.exchanges.list(),
			resources.loadPointTypes(),
		])

		targets.value = {
			points: resources.pointTypes.map(({ id, name }) => ({ id, name })),
			item: items,
			perk: perks,
			effect: effects,
		}
		exchangeOptions.value = offers.map(({ id, name }) => ({ id, name }))
	}

	const fetchCatalog = (kind: CatalogKind, includeDeleted = false) =>
		api.admin.catalog.list(kind, includeDeleted)

	const lastRequest: Partial<Record<CatalogKind, number>> = {}

	const loadCatalog = async (kind: CatalogKind) => {
		const request = (lastRequest[kind] ?? 0) + 1
		lastRequest[kind] = request

		const list = await fetchCatalog(kind, showDeleted.value)

		// a slower answer read before the switch «Показать удалённые» must not replace a newer one
		if (request !== lastRequest[kind]) return

		lists.value[kind] = list
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

	const setDeleted = async (
		kind: CatalogKind,
		entry: CatalogEntry,
		deleted: boolean,
	) => {
		const toast = useToastStore()

		try {
			if (deleted) {
				await api.admin.catalog.remove(kind, entry.id)
			} else {
				await api.admin.catalog.restore(kind, entry.id)
			}

			toast.show(
				deleted ? 'Удалено' : 'Возвращено',
				deleted
					? `${entry.name}: скрыто у игроков, история сохранится.`
					: entry.name,
				deleted ? 'info' : 'success',
			)

			await Promise.all([loadCatalog(kind), refreshUserData(kind)])
		} catch (e) {
			toast.error(e)
		}
	}

	const saveExchange = async (
		id: number | undefined,
		input: AdminExchangeInput,
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

	const setExchangeDeleted = async (
		exchange: AdminExchange,
		deleted: boolean,
	) => {
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
		lists,
		exchanges,
		showDeleted,
		targets,
		exchangeOptions,
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

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	WheelCatalogEntry,
	WheelCatalogGroup,
	SpinCostRow,
} from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useToastStore } from './toastStore'

export const useAdminWheelStore = defineStore(StoreName.AdminWheel, () => {
	const kind = ref<WheelCatalogGroup['kind']>('changes')
	const groups = ref<WheelCatalogGroup[]>([])
	const groupId = ref<number>()

	const group = computed(
		() => groups.value.find((g) => g.id === groupId.value) ?? groups.value[0],
	)

	const load = async () => {
		const requested = kind.value
		const loaded = await api.admin.wheel.groups(requested)

		// the tab may have been switched while the groups were loading
		if (requested === kind.value) groups.value = loaded
	}

	const setKind = async (value: WheelCatalogGroup['kind']) => {
		kind.value = value
		groupId.value = undefined
		groups.value = []

		try {
			await load()
		} catch (e) {
			useToastStore().error(e)
		}
	}

	/** runs the request, shows the toast and refreshes the groups */
	const run = async (
		request: () => Promise<unknown>,
		toast?: { title: string; text: string; tone?: 'success' | 'info' },
	) => {
		const toastStore = useToastStore()

		try {
			await request()

			if (toast) toastStore.show(toast.title, toast.text, toast.tone)

			await load()
			return true
		} catch (e) {
			toastStore.error(e)
			return false
		}
	}

	const addGroup = async (name: string) => {
		const ok = await run(() => api.admin.wheel.createGroup(kind.value, name), {
			title: 'Добавлено',
			text: name,
		})

		if (ok) groupId.value = groups.value.find((g) => g.name === name)?.id

		return ok
	}

	const renameGroup = (target: WheelCatalogGroup, name: string) =>
		run(() => api.admin.wheel.renameGroup(target.id, name), {
			title: 'Сохранено',
			text: name,
		})

	const removeGroup = (target: WheelCatalogGroup) =>
		run(() => api.admin.wheel.removeGroup(target.id), {
			title: 'Группа удалена',
			text: target.name,
			tone: 'info',
		})

	const setNoRepeat = (target: WheelCatalogGroup, value: boolean) =>
		run(() => api.admin.wheel.setNoRepeat(target.id, value))

	const saveEntry = (
		target: WheelCatalogGroup,
		entry: WheelCatalogEntry | undefined,
		input: Pick<
			WheelCatalogEntry,
			'name' | 'description' | 'entries' | 'isManualChange' | 'applyMode'
		>,
	) =>
		run(() => api.admin.wheel.saveEntry(target.id, entry?.id, input), {
			title: entry ? 'Сохранено' : 'Добавлено',
			text: input.name,
		})

	const removeEntry = (target: WheelCatalogGroup, entry: WheelCatalogEntry) =>
		run(() => api.admin.wheel.removeEntry(target.id, entry.id), {
			title: 'Пункт удалён',
			text: entry.name,
			tone: 'info',
		})

	const saveSpinCost = (target: WheelCatalogGroup, rows: SpinCostRow[]) =>
		run(() => api.admin.wheel.saveSpinCost(target.id, rows), {
			title: rows.length ? 'Цена сохранена' : 'Прокрут бесплатный',
			text: target.name,
			tone: rows.length ? 'success' : 'info',
		})

	return {
		kind,
		groups,
		groupId,
		group,
		load,
		saveSpinCost,
		setKind,
		addGroup,
		renameGroup,
		removeGroup,
		setNoRepeat,
		saveEntry,
		removeEntry,
	}
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	AdminWheelEntry,
	AdminWheelGroup,
	SpinCostRow,
} from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useToastStore } from './toastStore'

export const useAdminWheelStore = defineStore(StoreName.AdminWheel, () => {
	const kind = ref<AdminWheelGroup['kind']>('changes')
	const groups = ref<AdminWheelGroup[]>([])
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

	const setKind = async (value: AdminWheelGroup['kind']) => {
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

	const renameGroup = (target: AdminWheelGroup, name: string) =>
		run(() => api.admin.wheel.renameGroup(target.id, name), {
			title: 'Сохранено',
			text: name,
		})

	const removeGroup = (target: AdminWheelGroup) =>
		run(() => api.admin.wheel.removeGroup(target.id), {
			title: 'Группа удалена',
			text: target.name,
			tone: 'info',
		})

	const setNoRepeat = (target: AdminWheelGroup, value: boolean) =>
		run(() => api.admin.wheel.setNoRepeat(target.id, value))

	const saveEntry = (
		target: AdminWheelGroup,
		entry: AdminWheelEntry | undefined,
		input: Pick<AdminWheelEntry, 'name' | 'description' | 'entries' | 'isManualChange'>,
	) =>
		run(() => api.admin.wheel.saveEntry(target.id, entry?.id, input), {
			title: entry ? 'Сохранено' : 'Добавлено',
			text: input.name,
		})

	const removeEntry = (target: AdminWheelGroup, entry: AdminWheelEntry) =>
		run(() => api.admin.wheel.removeEntry(target.id, entry.id), {
			title: 'Пункт удалён',
			text: entry.name,
			tone: 'info',
		})

	const loadSpinCost = (target: AdminWheelGroup) => api.admin.wheel.spinCost(target.id)

	const saveSpinCost = async (target: AdminWheelGroup, rows: SpinCostRow[]) => {
		const toastStore = useToastStore()

		try {
			await api.admin.wheel.saveSpinCost(target.id, rows)
			toastStore.show(
				rows.length ? 'Цена сохранена' : 'Прокрут бесплатный',
				target.name,
				rows.length ? 'success' : 'info',
			)
			return true
		} catch (e) {
			toastStore.error(e)
			return false
		}
	}

	return {
		kind,
		groups,
		groupId,
		group,
		load,
		loadSpinCost,
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

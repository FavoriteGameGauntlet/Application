import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api-facade/api'
import type { SystemParameter } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { useToastStore } from './toastStore'

export const useAdminParametersStore = defineStore(StoreName.AdminParameters, () => {
	const parameters = ref<SystemParameter[]>([])

	const load = async () => {
		parameters.value = await api.admin.parameters.list()
	}

	const run = async (
		name: string,
		request: () => Promise<void>,
		toast: { title: string; tone?: 'success' | 'info' },
	) => {
		const toastStore = useToastStore()

		try {
			await request()
			toastStore.show(toast.title, name, toast.tone)
			await load()
			return true
		} catch (e) {
			toastStore.error(e)
			return false
		}
	}

	const save = (name: string, value: string) =>
		run(name, () => api.admin.parameters.save(name, value), { title: 'Сохранено' })

	const reset = (name: string) =>
		run(name, () => api.admin.parameters.reset(name), {
			title: 'Вернули значение по умолчанию',
			tone: 'info',
		})

	return { parameters, load, save, reset }
})

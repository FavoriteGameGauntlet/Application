import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HttpErrorResponse } from '../api-facade/http'
import { StoreName } from '../enums/storeName'

export type ToastTone = 'success' | 'info' | 'danger'

type Toast = { title: string; text?: string; tone: ToastTone }

const TOAST_DURATION_MS = 3000

export const useToastStore = defineStore(StoreName.Toast, () => {
	const toast = ref<Toast | null>(null)

	let timeout: ReturnType<typeof setTimeout> | undefined

	const close = () => {
		clearTimeout(timeout)
		toast.value = null
	}

	const show = (title: string, text?: string, tone: ToastTone = 'success') => {
		clearTimeout(timeout)
		toast.value = { title, text, tone }
		timeout = setTimeout(close, TOAST_DURATION_MS)
	}

	const error = (e: unknown) =>
		show(
			'Ошибка',
			(e as Partial<HttpErrorResponse>).body?.message ??
				'Что-то пошло не так. Попробуй ещё раз.',
			'danger',
		)

	return { toast, show, error, close }
})

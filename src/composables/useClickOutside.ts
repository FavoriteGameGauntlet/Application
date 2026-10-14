import { onMounted, onUnmounted, type ShallowRef } from 'vue'

/** calls the handler on clicks outside of the target element */
export const useClickOutside = (
	target: Readonly<ShallowRef<HTMLElement | null>>,
	handler: () => void,
) => {
	const onClick = (event: MouseEvent) => {
		if (!target.value?.contains(event.target as Node)) {
			handler()
		}
	}

	onMounted(() => document.addEventListener('click', onClick))
	onUnmounted(() => document.removeEventListener('click', onClick))
}

import {
	nextTick,
	onMounted,
	onUnmounted,
	ref,
	watch,
	type ShallowRef,
} from 'vue'

/**
 * How many rows of the container fit into its height, at least one. The rows
 * are the container's children of the same height, and the container's own
 * height must not depend on them.
 */
export const useFitCount = (
	container: Readonly<ShallowRef<HTMLElement | null>>,
	total: () => number,
) => {
	// until the first measurement every row is rendered, so there is one to measure
	const count = ref(Infinity)

	let observer: ResizeObserver | undefined

	const measure = () => {
		const el = container.value
		const row = el?.firstElementChild as HTMLElement | null | undefined

		if (!el || !row) return

		const gap = parseFloat(getComputedStyle(el).rowGap) || 0

		count.value = Math.max(
			1,
			Math.floor((el.clientHeight + gap) / (row.offsetHeight + gap)),
		)
	}

	onMounted(() => {
		observer = new ResizeObserver(measure)
		observer.observe(container.value!)
	})

	onUnmounted(() => observer?.disconnect())

	// the container keeps its size when the first row appears or goes away
	watch(total, () => nextTick(measure))

	return count
}

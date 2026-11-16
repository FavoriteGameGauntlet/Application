<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'

type Props = {
	open: boolean
	/** the element the panel hangs from; clicks on it are not "outside" */
	anchor: HTMLElement | null
	/** the panel is at least as wide as the anchor and at least this wide */
	minWidth?: number
	/** `floating` is the dark surface of menus */
	surface?: 'card' | 'floating'
	/** `left` and `right` put a `minWidth` wide panel beside the anchor, top to top, kept inside the window */
	side?: 'below' | 'left' | 'right'
	/** a hover card: the pointer goes through it to the rows under it */
	passive?: boolean
}

const {
	open,
	anchor,
	minWidth = 0,
	surface = 'card',
	side = 'below',
} = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const panel = useTemplateRef<HTMLElement>('panel')

const style = ref<Record<string, string>>({})

const GAP = 4
const SIDE_GAP = 16
const EDGE = 8
/** below this much room under the anchor the panel opens upwards */
const ROOM = 220

/**
 * The interface scale is a CSS zoom of the root, and `getBoundingClientRect` may answer in
 * screen pixels while `left` and `top` of the panel are layout units. The body fills the
 * window, so its rectangle against its own size gives that ratio and the window in layout units.
 */
function place() {
	if (!anchor) return

	const { body } = document
	const scale = body.getBoundingClientRect().width / body.offsetWidth || 1
	const viewWidth = body.offsetWidth
	const viewHeight = body.offsetHeight

	const screenRect = anchor.getBoundingClientRect()
	const rect = {
		left: screenRect.left / scale,
		top: screenRect.top / scale,
		bottom: screenRect.bottom / scale,
		width: screenRect.width / scale,
	}

	if (side !== 'below') {
		const height = panel.value?.offsetHeight ?? 0
		const sideLeft =
			side === 'left'
				? rect.left - SIDE_GAP - minWidth
				: rect.left + rect.width + SIDE_GAP

		style.value = {
			left: `${Math.max(EDGE, Math.min(sideLeft, viewWidth - EDGE - minWidth))}px`,
			top: `${Math.max(EDGE, Math.min(rect.top, viewHeight - EDGE - height))}px`,
			width: `${minWidth}px`,
			maxHeight: `${viewHeight - 2 * EDGE}px`,
		}

		return
	}

	const width = Math.max(rect.width, minWidth)
	const left = Math.max(EDGE, Math.min(rect.left, viewWidth - EDGE - width))
	const below = viewHeight - rect.bottom - GAP - EDGE
	const above = rect.top - GAP - EDGE

	style.value =
		below >= ROOM || below >= above
			? {
					left: `${left}px`,
					top: `${rect.bottom + GAP}px`,
					width: `${width}px`,
					maxHeight: `${below}px`,
				}
			: {
					left: `${left}px`,
					bottom: `${viewHeight - rect.top + GAP}px`,
					width: `${width}px`,
					maxHeight: `${above}px`,
				}
}

function onPointerDown(event: PointerEvent) {
	const target = event.target as Node

	if (panel.value?.contains(target) || anchor?.contains(target)) return

	emit('close')
}

/** Escape closes the panel only, not the dialog under it, so it is caught first */
function onKeydown(event: KeyboardEvent) {
	if (event.key !== 'Escape') return

	event.stopPropagation()
	emit('close')
}

function onScroll(event: Event) {
	if (panel.value?.contains(event.target as Node)) return

	place()
}

/** the arrows walk over the focusable rows: a search field and the options */
function onPanelKeydown(event: KeyboardEvent) {
	// Enter belongs to the panel: a dialog under it would take it as "submit"
	if (event.key === 'Enter') event.stopPropagation()

	if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

	const items = [...(panel.value?.querySelectorAll('input, button') ?? [])]
	const index = items.indexOf(document.activeElement as Element)
	const next = index + (event.key === 'ArrowDown' ? 1 : -1)

	event.preventDefault()
	;(
		items[Math.max(0, Math.min(items.length - 1, next))] as HTMLElement
	)?.focus()
}

function listen() {
	document.addEventListener('pointerdown', onPointerDown, true)
	document.addEventListener('keydown', onKeydown, true)
	addEventListener('resize', place)
	addEventListener('scroll', onScroll, true)
}

function unlisten() {
	document.removeEventListener('pointerdown', onPointerDown, true)
	document.removeEventListener('keydown', onKeydown, true)
	removeEventListener('resize', place)
	removeEventListener('scroll', onScroll, true)
}

watch(
	() => open,
	async (isOpen) => {
		if (!isOpen) return unlisten()

		place()
		listen()
		await nextTick()
		place()
	},
	{ immediate: true },
)

onBeforeUnmount(unlisten)
</script>

<template>
	<Teleport to="body">
		<div
			v-if="open"
			ref="panel"
			class="ui-popover"
			:class="[`ui-popover--${surface}`, { 'ui-popover--passive': passive }]"
			:style
			@keydown="onPanelKeydown"
		>
			<slot />
		</div>
	</Teleport>
</template>

<style scoped>
/* above the dialog overlay (100) */
.ui-popover {
	position: fixed;
	z-index: 110;
	display: flex;
	flex-direction: column;
	padding: 6px;
	overflow-y: auto;
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
}

.ui-popover--passive {
	pointer-events: none;
}

.ui-popover--floating {
	background: var(--surface-floating);
	border-color: var(--border-floating);
}
</style>

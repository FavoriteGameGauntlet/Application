<script setup lang="ts">
import rough from 'roughjs'
import { useTemplateRef, watch, ref } from 'vue'
import type { RouteName } from '../../../router/routeNames'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useResizeObserver } from '../../../composables/useResizeObserver'

defineProps<{ to: RouteName; disabled?: boolean }>()

const seed = Math.floor(Math.random() * Math.pow(2, 31)) + 1

const settings = useSettingsStore()
const { roughnessModifier } = storeToRefs(settings)

const wrapperEl = useTemplateRef<HTMLSpanElement>('wrapperEl')
const svgEl = useTemplateRef<SVGSVGElement>('svgEl')

const W = ref(0)
const H = ref(0)

function drawShapes() {
	if (!svgEl.value || !wrapperEl.value) return

	const w = W.value
	const h = H.value

	while (svgEl.value.firstChild) svgEl.value.removeChild(svgEl.value.firstChild)

	const rc = rough.svg(svgEl.value)
	const opts = {
		roughness: roughnessModifier.value,
		seed,
		bowing: 1.5,
	}

	const bg = rc.rectangle(-4, -2, w + 8, h + 4, {
		...opts,
		fill: '#bedbff',
		fillStyle: 'solid',
		stroke: 'transparent',
		strokeWidth: 1.5,
	})
	svgEl.value.appendChild(bg)

	const underline = rc.line(0, h + 0, w, h + 0, {
		...opts,
		stroke: '#2b7fff',
		strokeWidth: 1.5,
	})
	svgEl.value.appendChild(underline)
}

useResizeObserver(wrapperEl, ([entry]) => {
	W.value = entry.contentRect.width
	H.value = entry.contentRect.height
	drawShapes()
})

watch(roughnessModifier, drawShapes)
</script>

<template>
	<RouterLink
		class="navbar-link"
		:class="{ 'navbar-link--disabled': disabled }"
		activeClass="navbar-link--active"
		:to="{ name: to }"
	>
		<span ref="wrapperEl" class="navbar-link__inner">
			<slot />

			<svg
				ref="svgEl"
				class="navbar-link__svg"
				:width="W"
				:height="H"
				aria-hidden="true"
			/>
		</span>
	</RouterLink>
</template>

<style scoped>
.navbar-link {
	color: #2b7fff;
	text-decoration: none;
}

.navbar-link__inner {
	position: relative;
	display: inline-block;
}

.navbar-link--active {
	color: black;
}

.navbar-link--disabled {
	pointer-events: none;
	user-select: none;
	cursor: default;
	opacity: 0.4;
}

.navbar-link__svg {
	position: absolute;
	top: 0;
	left: 0;
	z-index: -1;
	overflow: visible;
	pointer-events: none;
}

/* underline = first child, bg rect = second child */
.navbar-link__svg > :nth-child(2) {
	opacity: 0;
}
.navbar-link__svg > :nth-child(1) {
	opacity: 0;
}

.navbar-link:hover .navbar-link__svg > :nth-child(2) {
	opacity: 1;
}

.navbar-link--active .navbar-link__svg > :nth-child(1) {
	opacity: 1;
}
</style>

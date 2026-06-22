<script setup lang="ts">
import { storeToRefs } from 'pinia'
import rough from 'roughjs'
import { type RoughSVG } from 'roughjs/bin/svg'
import { ref, useTemplateRef, watch, watchEffect } from 'vue'
import { useResizeObserver } from '../../composables/useResizeObserver'
import type { FillStyle } from '../../enums/fillStyle'
import { useSettingsStore } from '../../stores/settingsStore'

type Props = {
	fillStyle?: FillStyle
	fillColor?: string
	disabled?: boolean
}

const { fillStyle = 'solid' } = defineProps<Props>()

const seed = Math.floor(Math.random() * Math.pow(2, 31)) + 1

const settings = useSettingsStore()

const { roughnessModifier } = storeToRefs(settings)

const svg = useTemplateRef('svg')
const roughSvg = ref<RoughSVG>()
const svgRect = ref<SVGElement>()

watchEffect(() => {
	if (svg.value) roughSvg.value = rough.svg(svg.value)
})

useResizeObserver(svg, () => {
	if (!roughSvg.value || !svg.value) return

	const newNode = makeRectangle(roughSvg.value!, svg.value!)
	svgRect.value?.remove()
	svgRect.value = newNode
	svg.value!.appendChild(newNode)
})

const makeRectangle = (
	roughSvg: RoughSVG,
	svgElement: SVGElement,
): SVGElement => {
	const { clientHeight, clientWidth } = svgElement

	return roughSvg.rectangle(5, 5, clientWidth - 10, clientHeight - 10, {
		fill: `#8ec5ff`,
		fillStyle,
		roughness: roughnessModifier.value,
		strokeWidth: 2.5,
		bowing: 1,
		seed,
	})
}

watch([svg, roughSvg, roughnessModifier], () => {
	if (!svg.value || !roughSvg.value) return

	svgRect.value?.remove()

	const rect = makeRectangle(roughSvg.value, svg.value)

	svgRect.value = rect
	svg.value.appendChild(rect)
})
</script>

<template>
	<button class="ui-button" :disabled>
		<svg class="svg" ref="svg"></svg>
		<div class="slot"><slot /></div>
	</button>
</template>

<style scoped>
.ui-button {
	position: relative;
	cursor: pointer;
	overflow: visible;
	height: 100%;
	width: 100%;
}

.ui-button:disabled {
	opacity: 50%;
	pointer-events: none;
}

.svg {
	width: 100%;
	height: 100%;
}

.slot {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
}
</style>

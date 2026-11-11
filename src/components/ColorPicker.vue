<script setup lang="ts">
import { MEMBER_COLORS } from '../constants/memberColors'
import UiInput from './ui/UiInput.vue'

type Props = {
	label: string
	hint?: string
}

const { label, hint } = defineProps<Props>()

/** lowercase hex, any value is allowed: the palette is only a shortcut */
const color = defineModel<string>({ required: true })
</script>

<template>
	<div class="picker">
		<span class="picker__label">{{ label }}</span>

		<div class="picker__swatches">
			<button
				v-for="swatch in MEMBER_COLORS"
				:key="swatch"
				type="button"
				class="swatch"
				:class="{ 'swatch--on': swatch === color.trim().toLowerCase() }"
				:style="{ background: swatch }"
				:aria-label="swatch"
				:aria-pressed="swatch === color.trim().toLowerCase()"
				@click="color = swatch"
			></button>
		</div>

		<UiInput v-model="color" placeholder="#ffb000" aria-label="Свой цвет" />

		<span v-if="hint" class="picker__hint">{{ hint }}</span>
	</div>
</template>

<style scoped>
.picker {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.picker__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.picker__swatches {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.swatch {
	width: 28px;
	height: 28px;
	padding: 0;
	border: 1px solid var(--border-subtle);
	border-radius: 50%;
	cursor: pointer;
}

.swatch--on {
	outline: 2px solid var(--text-strong);
	outline-offset: 2px;
}

.picker__hint {
	font: var(--type-caption);
	color: var(--text-muted);
}
</style>

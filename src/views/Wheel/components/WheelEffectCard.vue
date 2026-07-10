<script setup lang="ts">
import type { RolledWheelEffectDto } from '../../../api-facade/models/wheel-effects-models'

defineProps<{
	effect: RolledWheelEffectDto
	isCenter?: boolean
	isPlaceholder?: boolean
}>()

const emit = defineEmits<{
	select: [effect: RolledWheelEffectDto]
}>()
</script>

<template>
	<div
		class="effect-card"
		:class="{
			'effect-card--center': isCenter,
			'effect-card--placeholder': isPlaceholder,
		}"
		@click="!isPlaceholder && emit('select', effect)"
	>
		<span class="effect-name">{{ effect.name }}</span>
		<label
			class="effect-applied"
			:class="{ 'effect-applied--hidden': isPlaceholder }"
			@click.stop
		>
			<input type="checkbox" :checked="effect.isApplied" disabled />
			Применён
		</label>
	</div>
</template>

<style scoped>
.effect-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 16px;
	border: 1px solid #64748b;
	cursor: pointer;
}

.effect-card:hover {
	background-color: #f8fafc;
}

.effect-card--center {
	border-width: 2px;
	border-color: #0f172a;
}

.effect-card--placeholder {
	cursor: default;
}

.effect-card--placeholder:hover {
	background-color: transparent;
}

.effect-name {
	display: inline-block;
	min-height: 1.2em;
	line-height: 1.2;
	font-weight: 600;
}

.effect-applied {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 0.75rem;
	color: #64748b;
	cursor: default;
}

.effect-applied--hidden {
	visibility: hidden;
}
</style>

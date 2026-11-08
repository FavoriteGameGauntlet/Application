<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import UiIcon from './UiIcon.vue'

type Props = {
	label?: string
	max?: number
}

const { max = 10 } = defineProps<Props>()

/** 0 means no rating yet */
const model = defineModel<number>({ default: 0 })

const labelId = useId()
const hovered = ref(0)
const stars = ref<HTMLButtonElement[]>([])

const shown = computed(() => hovered.value || model.value)

/** with no rating the group is entered at the first star */
const tabbable = (n: number) => n === (model.value || 1)

const select = (n: number) => {
	model.value = n
}

const onKeydown = (event: KeyboardEvent) => {
	const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key]

	if (!step) return

	event.preventDefault()

	const next = Math.min(max, Math.max(1, (model.value || 0) + step))

	select(next)
	stars.value[next - 1]?.focus()
}
</script>

<template>
	<div class="ui-rating">
		<span v-if="label" :id="labelId" class="ui-rating__label">{{ label }}</span>

		<div class="ui-rating__row">
			<div
				class="ui-rating__stars"
				role="radiogroup"
				:aria-labelledby="label ? labelId : undefined"
				@mouseleave="hovered = 0"
				@keydown="onKeydown"
			>
				<button
					v-for="n in max"
					:key="n"
					ref="stars"
					class="ui-rating__star"
					:class="{ 'ui-rating__star--on': n <= shown }"
					type="button"
					role="radio"
					:aria-checked="n === model"
					:aria-label="`${n} из ${max}`"
					:tabindex="tabbable(n) ? 0 : -1"
					@mouseenter="hovered = n"
					@click="select(n)"
				>
					<UiIcon :name="n <= shown ? 'star-filled' : 'star'" :size="26" />
				</button>
			</div>

			<span class="ui-rating__value" :class="{ 'ui-rating__value--empty': !shown }">
				{{ shown ? `${shown} / ${max}` : 'нет оценки' }}
			</span>
		</div>
	</div>
</template>

<style scoped>
.ui-rating {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.ui-rating__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.ui-rating__row {
	display: flex;
	flex-wrap: wrap;
	column-gap: 16px;
	row-gap: 4px;
	align-items: center;
}

.ui-rating__stars {
	display: flex;
}

.ui-rating__star {
	display: flex;
	padding: 3px;
	color: var(--border-strong);
	cursor: pointer;
	border-radius: var(--radius-sm);
	outline: 0;
	transition:
		color var(--dur-base) var(--ease-out),
		transform var(--dur-base) var(--ease-snap);
}

.ui-rating__star--on {
	color: var(--accent);
}

.ui-rating__star:hover {
	transform: scale(1.12);
}

.ui-rating__star:focus-visible {
	box-shadow: var(--shadow-focus);
}

.ui-rating__value {
	min-width: 64px;
	font: 600 15px / 1.45 var(--font-display);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.ui-rating__value--empty {
	font-weight: 500;
	color: var(--text-subtle);
}

@media (prefers-reduced-motion: reduce) {
	.ui-rating__star {
		transition: none;
	}

	.ui-rating__star:hover {
		transform: none;
	}
}
</style>

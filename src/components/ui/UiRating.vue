<script setup lang="ts">
import { computed, ref, useId } from 'vue'

type Props = {
	label?: string
	max?: number
	/** a rating that is shown, not edited */
	readonly?: boolean
}

const { max = 10, readonly } = defineProps<Props>()

/** 0 means no rating yet */
const model = defineModel<number>({ default: 0 })

const labelId = useId()
const hovered = ref(0)
const cells = ref<HTMLButtonElement[]>([])

const shown = computed(() => (readonly ? 0 : hovered.value) || model.value)

/** with no rating the group is entered at the first cell */
const tabbable = (n: number) => n === (model.value || 1)

const select = (n: number) => {
	model.value = n
}

const onKeydown = (event: KeyboardEvent) => {
	const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[
		event.key
	]

	if (!step) return

	event.preventDefault()

	const next = Math.min(max, Math.max(1, (model.value || 0) + step))

	select(next)
	cells.value[next - 1]?.focus()
}
</script>

<template>
	<div class="ui-rating">
		<span v-if="label" :id="labelId" class="ui-rating__label">{{ label }}</span>

		<div class="ui-rating__row">
			<div
				v-if="readonly"
				class="ui-rating__cells"
				role="img"
				:aria-label="`Оценка ${model} из ${max}`"
			>
				<span
					v-for="n in max"
					:key="n"
					class="ui-rating__cell"
					:class="{ 'ui-rating__cell--on': n <= model }"
				></span>
			</div>

			<div
				v-else
				class="ui-rating__cells"
				role="radiogroup"
				:aria-labelledby="label ? labelId : undefined"
				@mouseleave="hovered = 0"
				@keydown="onKeydown"
			>
				<button
					v-for="n in max"
					:key="n"
					ref="cells"
					class="ui-rating__cell ui-rating__cell--button"
					:class="{ 'ui-rating__cell--on': n <= shown }"
					type="button"
					role="radio"
					:aria-checked="n === model"
					:aria-label="`${n} из ${max}`"
					:tabindex="tabbable(n) ? 0 : -1"
					@mouseenter="hovered = n"
					@click="select(n)"
				></button>
			</div>

			<span v-if="shown" class="ui-rating__value"
				>{{ shown }}<small> / {{ max }}</small></span
			>
			<span v-else class="ui-rating__empty">нет оценки</span>
		</div>
	</div>
</template>

<style scoped>
.ui-rating {
	display: flex;
	flex-direction: column;
	gap: 8px;
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
	align-items: center;
	column-gap: 10px;
	row-gap: 4px;
}

.ui-rating__cells {
	display: flex;
	gap: 5px;
}

.ui-rating__cell {
	flex: none;
	width: 28px;
	height: 32px;
	padding: 0;
	background: var(--border-default);
	clip-path: var(--hex-clip);
	transition: background var(--dur-base) var(--ease-out);
}

.ui-rating__cell--button {
	cursor: pointer;
	outline: 0;
}

.ui-rating__cell--on {
	background: var(--accent);
}

/* the focus ring would be cut by the clip, so the cell darkens instead */
.ui-rating__cell--button:focus-visible {
	background: var(--accent-hover);
}

.ui-rating__value {
	font: 800 20px / 1 var(--font-display);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.ui-rating__value small {
	font: 600 14px / 1 var(--font-display);
	color: var(--text-muted);
}

.ui-rating__empty {
	font: 500 15px / 1.45 var(--font-display);
	color: var(--text-subtle);
}

@media (prefers-reduced-motion: reduce) {
	.ui-rating__cell {
		transition: none;
	}
}
</style>

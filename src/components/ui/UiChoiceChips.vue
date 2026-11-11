<script setup lang="ts">
type Props = {
	options: { value: string; label: string }[]
	label?: string
}

defineProps<Props>()

const model = defineModel<string>({ default: '' })
</script>

<template>
	<div class="ui-choice-chips" role="radiogroup" :aria-label="label">
		<button
			v-for="o in options"
			:key="o.value"
			class="ui-choice-chips__chip"
			:class="{ 'ui-choice-chips__chip--on': o.value === model }"
			type="button"
			role="radio"
			:aria-checked="o.value === model"
			@click="model = o.value"
		>
			{{ o.label }}
		</button>
	</div>
</template>

<style scoped>
.ui-choice-chips {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.ui-choice-chips__chip {
	height: 30px;
	padding: 0 12px;
	font: 500 14px / 1 var(--font-body);
	color: var(--text-strong);
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
	cursor: pointer;
}

.ui-choice-chips__chip--on {
	background: var(--accent-soft);
	box-shadow: inset 0 0 0 1.5px var(--accent);
}
</style>

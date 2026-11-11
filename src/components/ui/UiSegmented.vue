<script setup lang="ts">
type Props = {
	options: { value: string; label: string }[]
	label?: string
}

defineProps<Props>()

const model = defineModel<string>({ default: '' })
</script>

<template>
	<div class="ui-segmented" role="radiogroup" :aria-label="label">
		<button
			v-for="o in options"
			:key="o.value"
			class="ui-segmented__opt"
			:class="{ 'ui-segmented__opt--on': o.value === model }"
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
.ui-segmented {
	display: inline-flex;
	gap: 2px;
	padding: 3px;
	background: var(--surface-sunken);
	border-radius: var(--radius-md);
}

.ui-segmented__opt {
	height: 30px;
	padding: 0 12px;
	font: 600 14px / 1 var(--font-body);
	white-space: nowrap;
	color: var(--text-muted);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.ui-segmented__opt--on {
	color: var(--text-strong);
	background: var(--surface-card);
	box-shadow: var(--shadow-1);
}
</style>

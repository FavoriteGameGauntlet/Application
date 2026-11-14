<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import UiIcon from './UiIcon.vue'
import UiOptionList from './UiOptionList.vue'
import UiPopover from './UiPopover.vue'

type Props = {
	/** the muted word before the value, also the name for a screen reader */
	label: string
	options: { value: string; label: string }[]
	/** the accent border, a filter that narrows the list */
	active?: boolean
}

const { label, options } = defineProps<Props>()

const model = defineModel<string>({ default: '' })

const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

const groups = computed(() => [{ options }])

const chosen = computed(() => options.find((o) => o.value === model.value))

function onSelect(value: string) {
	model.value = value
	open.value = false
	trigger.value?.focus()
}
</script>

<template>
	<button
		ref="trigger"
		class="ui-filter-select"
		:class="{ 'ui-filter-select--active': active }"
		type="button"
		aria-haspopup="listbox"
		:aria-expanded="open"
		:aria-label="`${label}: ${chosen?.label ?? ''}`"
		@click="open = !open"
	>
		<span class="ui-filter-select__key">{{ label }}</span>
		{{ chosen?.label }}
		<UiIcon
			:name="open ? 'chevron-up' : 'chevron-down'"
			:size="16"
			color="var(--text-muted)"
		/>
	</button>

	<UiPopover :open :anchor="trigger" :min-width="180" @close="open = false">
		<UiOptionList :groups :selected="model" @select="onSelect" />
	</UiPopover>
</template>

<style scoped>
.ui-filter-select {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	height: 32px;
	padding: 0 10px 0 12px;
	font: 600 13px / 1 var(--font-body);
	color: var(--text-strong);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.ui-filter-select:hover {
	background: var(--surface-sunken);
}

.ui-filter-select--active,
.ui-filter-select[aria-expanded='true'] {
	border-color: var(--accent);
}

.ui-filter-select__key {
	font-weight: 500;
	color: var(--text-muted);
}
</style>

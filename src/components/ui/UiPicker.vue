<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import UiField from './UiField.vue'
import UiIcon from './UiIcon.vue'
import UiOptionList, { type OptionGroup } from './UiOptionList.vue'
import UiPopover from './UiPopover.vue'

defineOptions({ inheritAttrs: false })

type Props = {
	groups: OptionGroup[]
	label?: string
	hint?: string
	/** a quiet label for a field inside a titled group */
	sub?: boolean
	placeholder?: string
	/** a search field above the options */
	search?: boolean
	/** 36px high, for rows */
	compact?: boolean
	/** colours the chosen text: gaining is green, losing is red */
	tone?: 'get' | 'lose'
	/** the list is at least this wide, whatever the width of the button */
	panelWidth?: number
}

const { groups } = defineProps<Props>()

const model = defineModel<string>({ default: '' })

const open = ref(false)
const trigger = useTemplateRef<HTMLElement>('trigger')

const chosen = computed(() =>
	groups.flatMap((g) => g.options).find((o) => o.value === model.value),
)

function onSelect(value: string) {
	model.value = value
	open.value = false
	trigger.value?.focus()
}

function onClose() {
	open.value = false
}
</script>

<template>
	<UiField group :label :hint :sub>
		<button
			ref="trigger"
			v-bind="$attrs"
			class="ui-picker"
			:class="[{ 'ui-picker--compact': compact }, tone && `ui-picker--${tone}`]"
			type="button"
			aria-haspopup="listbox"
			:aria-expanded="open"
			@click="open = !open"
		>
			<span class="ui-picker__text" :class="{ 'ui-picker__text--ph': !chosen }">
				{{ chosen?.label ?? placeholder ?? '' }}
			</span>
			<UiIcon
				:name="open ? 'chevron-up' : 'chevron-down'"
				:size="compact ? 15 : 18"
				color="var(--text-muted)"
			/>
		</button>

		<UiPopover :open :anchor="trigger" :min-width="panelWidth" @close="onClose">
			<UiOptionList :groups :selected="model" :search @select="onSelect" />
		</UiPopover>
	</UiField>
</template>

<style scoped>
.ui-picker {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	width: 100%;
	height: 44px;
	padding: 0 14px;
	text-align: left;
	font: var(--type-body);
	color: var(--text-strong);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.ui-picker[aria-expanded='true'] {
	border-color: var(--border-strong);
	box-shadow: var(--shadow-focus);
}

.ui-picker--compact {
	height: 36px;
	padding: 0 10px;
	font: 400 15px / 1.45 var(--font-body);
}

.ui-picker--get {
	color: var(--success-text);
}

.ui-picker--lose {
	color: var(--danger-text);
}

.ui-picker__text {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ui-picker__text--ph {
	color: var(--text-muted);
}
</style>

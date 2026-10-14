<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import UiField from './UiField.vue'
import UiIcon from './UiIcon.vue'

defineOptions({ inheritAttrs: false })

type Props = {
	label?: string
	hint?: string
	error?: string
	icon?: string
	disabled?: boolean
	autoFocus?: boolean
}

const { autoFocus } = defineProps<Props>()

const model = defineModel<string>({ default: '' })

const input = useTemplateRef('input')

onMounted(() => {
	if (autoFocus) {
		input.value?.focus()
	}
})
</script>

<template>
	<UiField :label :hint :error>
		<span
			class="ui-input"
			:class="{ 'ui-input--error': error, 'ui-input--disabled': disabled }"
		>
			<UiIcon v-if="icon" :name="icon" :size="18" />
			<input ref="input" v-model="model" v-bind="$attrs" :disabled />
		</span>
	</UiField>
</template>

<style scoped>
.ui-input {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 44px;
	padding: 0 14px;
	color: var(--text-muted);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-sm);
	transition: box-shadow var(--dur-fast) var(--ease-out);
}

.ui-input:focus-within {
	border-color: var(--border-strong);
	box-shadow: var(--shadow-focus);
}

.ui-input--error,
.ui-input--error:focus-within {
	border-color: var(--danger);
}

.ui-input--disabled {
	background: var(--surface-sunken);
}

input {
	flex: 1;
	min-width: 0;
	font: var(--type-body);
	color: var(--text-strong);
	outline: 0;
	box-shadow: none;
}
</style>

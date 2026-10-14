<script setup lang="ts">
import { computed } from 'vue'
import UiField from './UiField.vue'
import UiIcon from './UiIcon.vue'

defineOptions({ inheritAttrs: false })

type Option = string | { value: string; label: string }

type Props = {
	label?: string
	hint?: string
	error?: string
	options?: Option[]
	placeholder?: string
}

const { options = [] } = defineProps<Props>()

const model = defineModel<string>({ default: '' })

const normalizedOptions = computed(() =>
	options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
)
</script>

<template>
	<UiField :label :hint :error>
		<span class="ui-select">
			<select
				v-model="model"
				v-bind="$attrs"
				class="ui-select__control"
				:class="{ 'ui-select__control--error': error }"
			>
				<option v-if="placeholder" value="">{{ placeholder }}</option>
				<option v-for="o in normalizedOptions" :key="o.value" :value="o.value">
					{{ o.label }}
				</option>
			</select>
			<UiIcon
				class="ui-select__chevron"
				name="chevron-down"
				:size="18"
				color="var(--text-muted)"
			/>
		</span>
	</UiField>
</template>

<style scoped>
.ui-select {
	position: relative;
	display: flex;
}

.ui-select__control {
	appearance: none;
	-webkit-appearance: none;
	width: 100%;
	height: 44px;
	padding: 0 40px 0 14px;
	font: var(--type-body);
	color: var(--text-strong);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-sm);
	outline: 0;
	cursor: pointer;
}

.ui-select__control:focus {
	border-color: var(--border-strong);
	box-shadow: var(--shadow-focus);
}

.ui-select__control--error,
.ui-select__control--error:focus {
	border-color: var(--danger);
}

.ui-select__chevron {
	position: absolute;
	right: 12px;
	top: 13px;
	pointer-events: none;
}
</style>

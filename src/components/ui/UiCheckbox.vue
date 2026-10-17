<script setup lang="ts">
import UiIcon from './UiIcon.vue'

type Props = {
	label?: string
	disabled?: boolean
}

defineProps<Props>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
	<label class="ui-checkbox" :class="{ 'ui-checkbox--disabled': disabled }">
		<input v-model="model" class="ui-checkbox__input" type="checkbox" :disabled />
		<span class="ui-checkbox__box" :class="{ 'ui-checkbox__box--on': model }">
			<UiIcon v-if="model" name="check" :size="14" />
		</span>
		<slot>{{ label }}</slot>
	</label>
</template>

<style scoped>
.ui-checkbox {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	font: var(--type-body);
	color: var(--text-body);
	cursor: pointer;
}

.ui-checkbox--disabled {
	cursor: not-allowed;
	opacity: 0.45;
}

.ui-checkbox__input {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
}

.ui-checkbox__input:focus-visible + .ui-checkbox__box {
	box-shadow: var(--shadow-focus);
}

.ui-checkbox__box {
	display: inline-flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	color: var(--fgg-navy);
	background: var(--surface-card);
	border: var(--border-width-strong) solid var(--border-default);
	border-radius: var(--radius-xs);
	transition: background var(--dur-fast) var(--ease-out);
}

.ui-checkbox__box--on {
	background: var(--accent);
	border-color: var(--accent);
}
</style>

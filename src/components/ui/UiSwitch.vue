<script setup lang="ts">
type Props = {
	label?: string
	disabled?: boolean
}

defineProps<Props>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
	<label class="ui-switch" :class="{ 'ui-switch--disabled': disabled }">
		<button
			class="ui-switch__track"
			:class="{ 'ui-switch__track--on': model }"
			type="button"
			role="switch"
			:aria-checked="model"
			:disabled
			@click="model = !model"
		>
			<span class="ui-switch__thumb"></span>
		</button>
		<slot>{{ label }}</slot>
	</label>
</template>

<style scoped>
.ui-switch {
	display: inline-flex;
	/* a label that wraps keeps the switch at its first line */
	align-items: flex-start;
	gap: 10px;
	font: var(--type-body);
	color: var(--text-body);
	cursor: pointer;
}

.ui-switch--disabled {
	cursor: not-allowed;
	opacity: 0.45;
}

.ui-switch__track {
	position: relative;
	width: 40px;
	height: 24px;
	padding: 0;
	cursor: inherit;
	background: var(--border-default);
	border-radius: 99px;
	transition: background var(--dur-base) var(--ease-out);
}

.ui-switch__track--on {
	background: var(--accent);
}

.ui-switch__thumb {
	position: absolute;
	top: 3px;
	left: 3px;
	width: 18px;
	height: 18px;
	background: #fff;
	border-radius: 99px;
	box-shadow: var(--shadow-1);
	transition: left var(--dur-base) var(--ease-snap);
}

.ui-switch__track--on .ui-switch__thumb {
	left: 19px;
	background: var(--fgg-navy);
}
</style>

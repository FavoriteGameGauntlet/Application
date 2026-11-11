<script setup lang="ts">
type Props = {
	label?: string
	hint?: string
	error?: string
	/** a quiet label for a field inside a titled group */
	sub?: boolean
	/** the content is not one control (chips, buttons), so a click on the label must not reach it */
	group?: boolean
}

defineProps<Props>()
</script>

<template>
	<component :is="group ? 'div' : 'label'" class="ui-field">
		<span
			v-if="label"
			class="ui-field__label"
			:class="{ 'ui-field__label--sub': sub }"
			>{{ label }}</span
		>
		<slot />
		<span
			v-if="error || hint"
			class="ui-field__note"
			:class="{ 'ui-field__note--error': error }"
		>
			{{ error || hint }}
		</span>
	</component>
</template>

<style scoped>
.ui-field {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	font: var(--type-body-sm);
}

.ui-field__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.ui-field__label--sub {
	font: 600 13px / 1 var(--font-body);
	letter-spacing: 0;
	text-transform: none;
	white-space: nowrap;
}

.ui-field__note {
	font: var(--type-caption);
	color: var(--text-subtle);
}

.ui-field__note--error {
	color: var(--danger-text);
}
</style>

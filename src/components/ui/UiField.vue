<script setup lang="ts">
type Props = {
	label?: string
	hint?: string
	error?: string
}

defineProps<Props>()
</script>

<template>
	<label class="ui-field">
		<span v-if="label" class="ui-field__label">{{ label }}</span>
		<slot />
		<span
			v-if="error || hint"
			class="ui-field__note"
			:class="{ 'ui-field__note--error': error }"
		>
			{{ error || hint }}
		</span>
	</label>
</template>

<style scoped>
.ui-field {
	display: flex;
	flex-direction: column;
	gap: 6px;
	font: var(--type-body-sm);
}

.ui-field__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.ui-field__note {
	font: var(--type-caption);
	color: var(--text-subtle);
}

.ui-field__note--error {
	color: var(--danger-text);
}
</style>

<script setup lang="ts">
import UiIcon from './UiIcon.vue'

type Props = {
	icon: string
	label?: string
	size?: 'sm' | 'md' | 'lg'
	variant?: 'ghost' | 'primary' | 'secondary' | 'outline'
	disabled?: boolean
}

const { size = 'md', variant = 'ghost' } = defineProps<Props>()

const dimensions = { sm: 32, md: 40, lg: 48 }
</script>

<template>
	<button
		class="ui-icon-button"
		:class="`ui-icon-button--${variant}`"
		:style="{ '--ui-icon-button-d': `${dimensions[size]}px` }"
		:aria-label="label"
		:title="label"
		:disabled
	>
		<UiIcon :name="icon" :size="Math.round(dimensions[size] * 0.48)" />
	</button>
</template>

<style scoped>
.ui-icon-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: var(--ui-icon-button-d);
	height: var(--ui-icon-button-d);
	padding: 0;
	color: var(--ui-icon-button-fg);
	background: var(--ui-icon-button-bg);
	border: var(--ui-icon-button-bd);
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition: background var(--dur-fast) var(--ease-out);
}

.ui-icon-button:hover:not(:disabled) {
	background: var(--ui-icon-button-bg-hover);
}

.ui-icon-button:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.ui-icon-button--ghost {
	--ui-icon-button-bg: transparent;
	--ui-icon-button-bg-hover: var(--surface-sunken);
	--ui-icon-button-fg: var(--text-strong);
	--ui-icon-button-bd: none;
}

.ui-icon-button--primary {
	--ui-icon-button-bg: var(--accent);
	--ui-icon-button-bg-hover: var(--accent-hover);
	--ui-icon-button-fg: var(--text-on-accent);
	--ui-icon-button-bd: none;
}

.ui-icon-button--secondary {
	--ui-icon-button-bg: var(--surface-contrast);
	--ui-icon-button-bg-hover: var(--surface-contrast-hover);
	--ui-icon-button-fg: var(--text-on-contrast);
	--ui-icon-button-bd: none;
}

.ui-icon-button--outline {
	--ui-icon-button-bg: transparent;
	--ui-icon-button-bg-hover: var(--surface-sunken);
	--ui-icon-button-fg: var(--text-strong);
	--ui-icon-button-bd: var(--border-width-strong) solid var(--border-strong);
}
</style>

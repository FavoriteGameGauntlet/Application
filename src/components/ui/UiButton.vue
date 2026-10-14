<script setup lang="ts">
import UiIcon from './UiIcon.vue'

type Props = {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
	size?: 'sm' | 'md' | 'lg'
	icon?: string
	iconRight?: string
	fullWidth?: boolean
	disabled?: boolean
}

const { variant = 'primary', size = 'md' } = defineProps<Props>()

const iconSizes = { sm: 16, md: 18, lg: 20 }
</script>

<template>
	<button
		class="ui-button"
		:class="[
			`ui-button--${variant}`,
			`ui-button--${size}`,
			{ 'ui-button--full': fullWidth },
		]"
		:disabled
	>
		<UiIcon v-if="icon" :name="icon" :size="iconSizes[size]" />
		<slot />
		<UiIcon v-if="iconRight" :name="iconRight" :size="iconSizes[size]" />
	</button>
</template>

<style scoped>
.ui-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	height: var(--ui-button-h);
	padding: 0 var(--ui-button-px);
	font: 700 var(--ui-button-fs) / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	white-space: nowrap;
	color: var(--ui-button-fg);
	background: var(--ui-button-bg);
	border: var(--border-width-strong) solid var(--ui-button-bd);
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		transform var(--dur-fast) var(--ease-out);
}

.ui-button:hover:not(:disabled) {
	background: var(--ui-button-bg-hover);
}

.ui-button:active:not(:disabled) {
	background: var(--ui-button-bg-press);
	transform: translateY(1px);
}

.ui-button:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.ui-button--full {
	width: 100%;
}

.ui-button--sm {
	--ui-button-h: 32px;
	--ui-button-px: 12px;
	--ui-button-fs: 13px;
}

.ui-button--md {
	--ui-button-h: 40px;
	--ui-button-px: 16px;
	--ui-button-fs: 14px;
}

.ui-button--lg {
	--ui-button-h: 52px;
	--ui-button-px: 22px;
	--ui-button-fs: 16px;
}

.ui-button--primary {
	--ui-button-bg: var(--accent);
	--ui-button-bg-hover: var(--accent-hover);
	--ui-button-bg-press: var(--accent-press);
	--ui-button-fg: var(--text-on-accent);
	--ui-button-bd: transparent;
}

.ui-button--secondary {
	--ui-button-bg: var(--surface-contrast);
	--ui-button-bg-hover: var(--surface-contrast-hover);
	--ui-button-bg-press: var(--surface-contrast-press);
	--ui-button-fg: var(--text-on-contrast);
	--ui-button-bd: transparent;
}

.ui-button--outline {
	--ui-button-bg: transparent;
	--ui-button-bg-hover: var(--surface-sunken);
	--ui-button-bg-press: var(--border-default);
	--ui-button-fg: var(--text-strong);
	--ui-button-bd: var(--border-strong);
}

.ui-button--ghost {
	--ui-button-bg: transparent;
	--ui-button-bg-hover: var(--surface-sunken);
	--ui-button-bg-press: var(--border-default);
	--ui-button-fg: var(--text-strong);
	--ui-button-bd: transparent;
}

.ui-button--danger {
	--ui-button-bg: var(--danger);
	--ui-button-bg-hover: #ef5d62;
	--ui-button-bg-press: var(--red-700);
	--ui-button-fg: #fff;
	--ui-button-bd: transparent;
}
</style>

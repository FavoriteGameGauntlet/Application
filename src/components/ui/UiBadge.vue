<script setup lang="ts">
type Props = {
	tone?: 'neutral' | 'accent' | 'navy' | 'success' | 'danger' | 'info'
	dot?: boolean
}

const { tone = 'neutral' } = defineProps<Props>()
</script>

<template>
	<span class="ui-badge" :class="`ui-badge--${tone}`">
		<span v-if="dot" class="ui-badge__dot"></span>
		<slot />
	</span>
</template>

<style scoped>
.ui-badge {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 22px;
	padding: 0 8px;
	font: 700 11px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	white-space: nowrap;
	color: var(--ui-badge-fg);
	background: var(--ui-badge-bg);
	border-radius: var(--radius-xs);
}

.ui-badge__dot {
	width: 6px;
	height: 6px;
	border-radius: 99px;
	background: currentColor;
}

.ui-badge--neutral {
	--ui-badge-bg: var(--surface-sunken);
	--ui-badge-fg: var(--text-muted);
}

.ui-badge--accent {
	--ui-badge-bg: var(--accent);
	--ui-badge-fg: var(--text-on-accent);
}

.ui-badge--navy {
	--ui-badge-bg: var(--surface-contrast);
	--ui-badge-fg: var(--text-on-contrast);
}

.ui-badge--success {
	--ui-badge-bg: var(--success-soft);
	--ui-badge-fg: var(--success-text);
}

.ui-badge--danger {
	--ui-badge-bg: var(--danger-soft);
	--ui-badge-fg: var(--danger-text);
}

.ui-badge--info {
	--ui-badge-bg: var(--info-soft);
	--ui-badge-fg: var(--info-text);
}
</style>

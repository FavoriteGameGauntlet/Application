<script setup lang="ts">
import type { Reward } from '../api-facade/contracts'

type Props = {
	title: string
	rows: Reward
}

defineProps<Props>()
</script>

<template>
	<div class="reward-popover">
		<span class="reward-popover__title">{{ title }}</span>
		<span v-for="row in rows" :key="row.label" class="reward-popover__row">
			<span>{{ row.label }}</span>
			<span class="reward-popover__value">{{ row.value }}</span>
		</span>
	</div>
</template>

<style scoped>
.reward-popover {
	z-index: 5;
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 240px;
	padding: 12px 14px;
	color: var(--text-on-floating);
	background: var(--surface-floating);
	border: 1px solid var(--border-floating);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
}

.reward-popover__title {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-on-floating-muted);
}

.reward-popover__row {
	display: flex;
	justify-content: space-between;
	gap: 8px;
	font: var(--type-body-sm);
}

.reward-popover__value {
	font: var(--type-mono);
}
</style>

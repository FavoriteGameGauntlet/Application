<script setup lang="ts">
import type { Change } from '../utils/formatResource'
import UiChange from './ui/UiChange.vue'

type Props = {
	title: string
	changes: Change[]
}

defineProps<Props>()
</script>

<template>
	<div class="reward-popover">
		<span class="reward-popover__title">{{ title }}</span>
		<UiChange
			v-for="(change, i) in changes"
			:key="i"
			class="reward-popover__change"
			:tone="change.tone"
			>{{ change.text }}</UiChange
		>
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
	color: var(--text-body);
	background: var(--surface-card);
	border: 1px solid var(--border-default);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
}

.reward-popover__title {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-strong);
}

.reward-popover__change {
	align-self: flex-start;
}
</style>

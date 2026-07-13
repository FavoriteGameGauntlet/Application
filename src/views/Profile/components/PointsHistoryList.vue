<script setup lang="ts">
import type { HistoryEntry } from '../../../types/pointsHistory'
import { formatInstant } from '../../../utils/temporal'

defineProps<{
	entries: HistoryEntry[]
	labelFor: (source: string) => string
	emptyMessage: string
}>()
</script>

<template>
	<p v-if="!entries.length" class="empty-message">{{ emptyMessage }}</p>
	<ul v-else class="item-list">
		<li v-for="(entry, i) in entries" :key="i" class="info-card">
			<div class="info-card__row">
				<span class="item-title">{{ labelFor(entry.changeSource) }}</span>
				<span class="item-meta">{{ formatInstant(entry.changeDate) }}</span>
			</div>
			<div
				v-if="'wheelEffectName' in entry && entry.wheelEffectName"
				class="info-card__row"
			>
				<span class="item-meta">Эффект</span>
				<span class="item-meta">{{ entry.wheelEffectName }}</span>
			</div>
			<div v-if="entry.sourceLogin" class="info-card__row">
				<span class="item-meta">От</span>
				<span class="item-meta">{{ entry.sourceLogin }}</span>
			</div>
			<div class="info-card__row">
				<span class="item-meta">Изменение</span>
				<span class="item-meta"
					>{{ entry.actualChangeValue > 0 ? '+' : ''
					}}{{ entry.actualChangeValue }}</span
				>
			</div>
			<div class="info-card__row">
				<span class="item-meta">Итог</span>
				<span class="item-meta">{{ entry.finalValue }}</span>
			</div>
		</li>
	</ul>
</template>

<style scoped>
.empty-message {
	color: var(--color-muted);
}

.item-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
	list-style: none;
	padding: 0;
	width: 100%;
}

.info-card {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px 16px;
	border: 1px solid var(--color-border);
	border-radius: 4px;
}

.info-card__row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
}

.item-title {
	font-weight: 500;
}

.item-meta {
	font-size: 0.875rem;
	color: var(--color-muted);
}
</style>

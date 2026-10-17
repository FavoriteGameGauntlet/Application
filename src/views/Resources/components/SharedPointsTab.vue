<script setup lang="ts">
import { computed, watch } from 'vue'
import { useJournalStore } from '../../../stores/journalStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { formatBounds } from '../../../utils/format'

const resourcesStore = useResourcesStore()
const journalStore = useJournalStore()

const rows = computed(() =>
	resourcesStore.sharedTypes.map((type) => ({
		type,
		value: resourcesStore.sharedPoints[type.id] ?? 0,
		bounds: formatBounds(type.minimum, type.maximum),
	})),
)

watch(() => journalStore.revision, () => resourcesStore.loadSharedPoints(), {
	immediate: true,
})
</script>

<template>
	<div class="table">
		<div class="table__row table__row--head">
			<span>Тип</span>
			<span>Границы</span>
			<span class="table__right">Значение</span>
		</div>

		<div v-for="row in rows" :key="row.type.id" class="table__row table__row--body">
			<span class="type">
				<span class="type__name">{{ row.type.name }}</span>
				<span class="type__text">{{ row.type.description }}</span>
			</span>
			<span class="table__bounds">{{ row.bounds }}</span>
			<span class="table__value">{{ row.value }}</span>
		</div>

		<div v-if="!rows.length" class="table__empty">В пати нет общих очков.</div>
	</div>

	<span class="note">Общие очки принадлежат всей пати. Менять их можно только ручной формой.</span>
</template>

<style scoped>
.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.table__row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 160px 140px;
	gap: 16px;
	align-items: center;
}

.table__row--head {
	padding: 12px 16px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__right,
.table__value {
	text-align: right;
}

.table__row--body {
	min-height: 56px;
	padding: 8px 16px;
	border-top: 1px solid var(--border-subtle);
}

.type {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.type__name {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.type__text {
	font: var(--type-caption);
	color: var(--text-muted);
}

.table__bounds {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.table__value {
	font: 700 15px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.table__empty {
	padding: 24px 16px;
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-align: center;
}

.note {
	font: var(--type-caption);
	color: var(--text-subtle);
}
</style>

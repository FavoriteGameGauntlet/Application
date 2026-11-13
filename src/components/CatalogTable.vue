<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CatalogEntry } from '../api-facade/contracts'
import type { CatalogTableRow } from './catalogTable'
import UiBadge from './ui/UiBadge.vue'
import UiIcon from './ui/UiIcon.vue'
import UiTag from './ui/UiTag.vue'

type Props = {
	/** the column titles, the name first */
	heads: string[]
	/** how many columns from the left are wide, the rest are narrow */
	wide: number
	rows: CatalogTableRow[]
	/** shown when there are no rows; undefined while the list is still loading */
	empty?: string
	/** a column of buttons at the end, filled by the `actions` slot */
	hasActions?: boolean
}

const { heads, wide, hasActions = false } = defineProps<Props>()

defineSlots<{ actions(props: { entry: CatalogEntry }): unknown }>()

const openId = ref<number>()

const columns = computed(() =>
	[
		...Array(wide).fill('minmax(0, 1.5fr)'),
		...Array(heads.length - wide).fill('140px'),
		...(hasActions ? ['76px'] : []),
	].join(' '),
)
</script>

<template>
	<div class="table" :style="{ '--columns': columns }">
		<div class="table__row table__row--head">
			<span class="table__name-head">{{ heads[0] }}</span>
			<span v-for="head in heads.slice(1)" :key="head">{{ head }}</span>
			<span v-if="hasActions"></span>
		</div>

		<div
			v-for="row in rows"
			:key="row.entry.id"
			class="item"
			:class="{ 'item--open': openId === row.entry.id }"
		>
			<div
				class="table__row table__row--body"
				@click="openId = openId === row.entry.id ? undefined : row.entry.id"
			>
				<div class="name" :class="{ 'cell--dead': row.entry.deleted }">
					<span class="name__chevron">
						<UiIcon
							:name="openId === row.entry.id ? 'chevron-down' : 'chevron-right'"
							:size="16"
						/>
					</span>
					<span class="name__title">{{ row.entry.name }}</span>
					<UiBadge v-if="row.entry.deleted">удалён</UiBadge>
				</div>

				<div
					v-if="row.main"
					class="tags"
					:class="{ 'cell--dead': row.entry.deleted }"
				>
					<UiTag v-for="tag in row.main" :key="tag">{{ tag }}</UiTag>
				</div>

				<span
					v-for="(value, i) in row.extra"
					:key="i"
					class="text"
					:class="{ 'cell--dead': row.entry.deleted }"
				>
					{{ value }}
				</span>

				<span v-if="hasActions" class="table__actions">
					<slot name="actions" :entry="row.entry" />
				</span>
			</div>

			<div v-if="openId === row.entry.id" class="item__desc">
				<span class="label">Описание</span>
				<span class="text">{{ row.entry.description || 'Без описания' }}</span>
				<span v-for="note in row.notes" :key="note" class="item__note">{{
					note
				}}</span>
			</div>
		</div>

		<div v-if="empty && !rows.length" class="table__empty">{{ empty }}</div>
	</div>
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
	grid-template-columns: var(--columns);
	gap: 12px;
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

.table__name-head {
	padding-left: 24px;
}

.table__row--body {
	min-height: 52px;
	padding: 10px 16px;
	cursor: pointer;
}

.table__row--body:hover {
	background: var(--surface-sunken);
}

.table__actions {
	display: flex;
	gap: 4px;
	justify-content: flex-end;
}

.table__empty {
	padding: 16px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}

.item {
	border-top: 1px solid var(--border-subtle);
}

.item--open {
	background: var(--surface-sunken);
}

.cell--dead {
	opacity: 0.5;
}

.name {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}

.name__chevron {
	display: flex;
	flex: none;
	margin-top: 3px;
	color: var(--text-muted);
}

.name__title {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.text {
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.item__desc {
	display: flex;
	flex-direction: column;
	gap: 6px;
	max-width: 720px;
	padding: 0 16px 16px 40px;
}

.item__note {
	font: var(--type-caption);
	color: var(--text-muted);
}
</style>

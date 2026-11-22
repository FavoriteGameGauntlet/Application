<script setup lang="ts">
import { computed } from 'vue'
import type {
	WheelCatalogEntry,
	WheelCatalogGroup,
} from '../api-facade/contracts'
import { applyModeFacts } from '../utils/applyMode'
import { changeTone } from './catalogTable'
import UiCountBadge from './ui/UiCountBadge.vue'
import UiInput from './ui/UiInput.vue'
import UiRowMenu, { type RowMenuItem } from './ui/UiRowMenu.vue'

/** without `menuOf` the rows have no menu, as the player catalogue shows them */
const { group, menuOf, emptyText } = defineProps<{
	group: WheelCatalogGroup
	menuOf?: (entry: WheelCatalogEntry) => RowMenuItem[]
	/** shown when the group has no items */
	emptyText: string
}>()

const query = defineModel<string>('query', { default: '' })

const isChanges = computed(() => group.kind === 'changes')

const found = computed(() => {
	const q = query.value.trim().toLowerCase()

	return group.entries.filter(
		(e) =>
			!q ||
			[e.name, e.description ?? '', ...e.changes].some((s) =>
				s.toLowerCase().includes(q),
			),
	)
})

/** a change in its row: green adds, red takes */
const tagsOf = (entry: WheelCatalogEntry) =>
	entry.changes.map((text, i) => ({
		text,
		tone: changeTone(entry.entries[i]?.amount ?? 0),
	}))
</script>

<template>
	<div class="bar">
		<span class="bar__label">{{
			isChanges ? 'Пункты группы' : 'Игры группы'
		}}</span>
		<UiCountBadge :value="found.length" />
		<div class="bar__spacer"></div>
		<div class="bar__search">
			<UiInput
				v-model="query"
				compact
				icon="search"
				placeholder="Найти…"
				aria-label="Поиск"
			/>
		</div>
		<slot name="action" />
	</div>

	<div
		class="table"
		:class="{ 'table--changes': isChanges, 'table--menu': menuOf }"
		role="table"
		:aria-label="isChanges ? 'Пункты группы' : 'Игры группы'"
	>
		<div class="row row--head" role="row">
			<span role="columnheader">{{ isChanges ? 'Пункт' : 'Игра' }}</span>
			<template v-if="isChanges">
				<span role="columnheader">Изменение</span>
				<span role="columnheader">Как применяется</span>
			</template>
		</div>

		<component
			:is="menuOf ? UiRowMenu : 'div'"
			v-for="entry in found"
			:key="entry.id"
			class="row"
			role="row"
			v-bind="
				menuOf
					? {
							label: isChanges ? 'Действия с пунктом' : 'Действия с игрой',
							items: menuOf(entry),
						}
					: {}
			"
		>
			<div class="cell cell--name" role="cell">
				<span class="name">{{ entry.name }}</span>
				<span v-if="isChanges && entry.description" class="desc">{{
					entry.description
				}}</span>
			</div>

			<template v-if="isChanges">
				<div class="cell cell--wrap" role="cell">
					<span
						v-for="(tag, i) in tagsOf(entry)"
						:key="i"
						class="tag"
						:class="`tag--${tag.tone}`"
						>{{ tag.text }}</span
					>
					<span v-if="!entry.changes.length" class="muted">—</span>
				</div>

				<div class="cell cell--wrap" role="cell">
					<span v-if="entry.isManualChange" class="fact">ручное изменение</span>
					<span v-if="applyModeFacts[entry.applyMode]" class="fact">{{
						applyModeFacts[entry.applyMode]
					}}</span>
				</div>
			</template>
		</component>

		<div v-if="!found.length" class="empty">
			{{ group.entries.length ? 'Ничего не найдено.' : emptyText }}
		</div>

		<slot name="add" />
	</div>
</template>

<style scoped>
.bar {
	display: flex;
	align-items: center;
	gap: 12px;
}

.bar__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.bar__spacer {
	flex: 1;
}

.bar__search {
	width: 240px;
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.row {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 16px;
	align-items: start;
	padding: 14px 20px;
	border-top: 1px solid var(--border-subtle);
}

/* 60px on the right belong to the «⋯» button */
.table--menu .row {
	padding-right: 60px;
}

.table--changes .row {
	grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.2fr) minmax(0, 0.9fr);
}

.row--head {
	padding-block: 12px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
	border-top: 0;
}

.table--menu .row:not(.row--head):hover {
	background: var(--surface-sunken);
}

.cell {
	min-width: 0;
}

.cell--name {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.cell--wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.name {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
	overflow-wrap: anywhere;
}

.desc {
	font: var(--type-caption);
	color: var(--text-muted);
	text-wrap: pretty;
}

.tag,
.fact {
	display: inline-flex;
	align-items: center;
	height: 26px;
	padding: 0 10px;
	font: 500 12px / 1 var(--font-body);
	color: var(--text-body);
	white-space: nowrap;
	border-radius: var(--radius-pill);
}

.tag {
	background: var(--surface-sunken);
}

.tag--plus {
	color: var(--success-text);
	background: var(--success-soft);
}

.tag--minus {
	color: var(--danger-text);
	background: var(--danger-soft);
}

.fact {
	border: var(--border-width) solid var(--border-default);
}

.muted {
	font: var(--type-caption);
	color: var(--text-muted);
}

.empty {
	padding: 16px 20px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}
</style>

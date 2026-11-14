<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CatalogEntry } from '../../api-facade/contracts'
import CatalogEntryCard from '../../components/CatalogEntryCard.vue'
import {
	type CatalogView,
	catalogKindOf,
	catalogSummary,
	catalogViews,
	filterCatalogEntries,
} from '../../components/catalogTable'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useResourcesStore } from '../../stores/resourcesStore'

const resourcesStore = useResourcesStore()

const view = ref<CatalogView>('points')
const query = ref('')
/** the open entry of each tab, so a tab keeps it when the user comes back */
const selected = ref<Partial<Record<CatalogView, number>>>({})

const listTitles: Record<CatalogView, string> = {
	points: 'Типы очков',
	shared: 'Общие очки',
	items: 'Предметы',
	perks: 'Перки',
	effects: 'Эффекты',
}

/** Undefined while the list of the tab is not loaded yet. */
const entriesOf = (tab: CatalogView): CatalogEntry[] | undefined => {
	const kind = catalogKindOf(tab)

	if (kind !== 'point-types') return resourcesStore.catalogEntries[kind]

	return resourcesStore.pointTypes
		.filter((type) => type.isShared === (tab === 'shared'))
		.map((type) => ({ ...type, deleted: false }))
}

const tabs = computed(() =>
	catalogViews.map((tab) => ({ ...tab, count: entriesOf(tab.value)?.length })),
)

const entries = computed(() => entriesOf(view.value))

const rows = computed(() =>
	filterCatalogEntries(entries.value ?? [], query.value).map((entry) => ({
		entry,
		...catalogSummary(view.value, entry),
	})),
)

const current = computed(
	() =>
		rows.value.find((row) => row.entry.id === selected.value[view.value]) ??
		rows.value[0],
)

watch(
	view,
	() => {
		query.value = ''

		const kind = catalogKindOf(view.value)

		if (kind !== 'point-types') resourcesStore.loadCatalogEntries(kind)
	},
	{ immediate: true },
)
</script>

<template>
	<div class="catalog">
		<UiPageTitle>Каталог</UiPageTitle>

		<UiTabs
			:model-value="view"
			:items="tabs"
			@update:model-value="view = $event as CatalogView"
		/>

		<div class="layout">
			<div class="panel">
				<div class="panel__search">
					<UiInput
						v-model="query"
						compact
						icon="search"
						placeholder="Найти в этой вкладке…"
						aria-label="Поиск по вкладке"
					/>
				</div>
				<div class="panel__head">
					<span>{{ listTitles[view] }}</span>
					<span class="panel__count">{{ rows.length }}</span>
				</div>
				<button
					v-for="row in rows"
					:key="row.entry.id"
					class="row"
					:class="{ 'row--on': row.entry.id === current?.entry.id }"
					type="button"
					:aria-pressed="row.entry.id === current?.entry.id"
					@click="selected[view] = row.entry.id"
				>
					<span class="row__main">
						<span class="row__name">{{ row.entry.name }}</span>
						<span
							v-for="(fact, i) in row.summary"
							:key="i"
							class="row__summary"
							:title="fact"
							>{{ fact }}</span
						>
					</span>
					<span v-if="row.badge" class="row__badge">{{ row.badge }}</span>
				</button>
				<div v-if="entries && !rows.length" class="panel__empty">
					{{ query.trim() ? 'Ничего не найдено.' : 'Пока ничего нет.' }}
				</div>
			</div>

			<div class="panel panel--card">
				<CatalogEntryCard
					v-if="current"
					:key="`${view}-${current.entry.id}`"
					:view="view"
					:entry="current.entry"
				/>
				<div v-else-if="entries" class="panel__empty">
					Выбери запись слева, и здесь появится её карточка.
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.catalog {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.layout {
	display: grid;
	grid-template-columns: 340px minmax(0, 1fr);
	gap: 20px;
	align-items: start;
}

.panel {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.panel--card {
	position: sticky;
	top: 24px;
	min-height: 480px;
}

.panel__search {
	padding: 12px;
}

.panel__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 20px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.panel__count {
	font: 500 12px / 1 var(--font-mono);
	letter-spacing: 0;
}

.panel__empty {
	padding: 20px;
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}

.panel--card > .panel__empty {
	border-top: 0;
}

.row {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 12px;
	align-items: center;
	width: 100%;
	padding: 14px 16px 14px 20px;
	font: inherit;
	color: inherit;
	text-align: left;
	background: transparent;
	border: 0;
	border-top: 1px solid var(--border-subtle);
	cursor: pointer;
}

.row:hover,
.row--on {
	background: var(--surface-sunken);
}

.row--on::before {
	content: '';
	position: absolute;
	top: 14px;
	bottom: 14px;
	left: 0;
	width: 3px;
	border-radius: 2px;
	background: var(--accent);
}

.row__main {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
}

.row__name {
	font: 600 15px / 1.35 var(--font-body);
	color: var(--text-strong);
}

.row__summary {
	overflow: hidden;
	font: var(--type-caption);
	color: var(--text-muted);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.row__badge {
	padding: 5px 8px;
	font: 500 12px / 1 var(--font-mono);
	color: var(--text-muted);
	white-space: nowrap;
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-pill);
}
</style>

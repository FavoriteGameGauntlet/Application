<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CatalogEntry } from '../../api-facade/contracts'
import {
	type CatalogView,
	catalogFacts,
	catalogHeads,
	catalogHolders,
	catalogKindOf,
	catalogTags,
	catalogViews,
	filterCatalogEntries,
} from '../../components/catalogTable'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiRowMenu, { type RowMenuItem } from '../../components/ui/UiRowMenu.vue'
import UiSwitch from '../../components/ui/UiSwitch.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useAdminCatalogStore } from '../../stores/adminCatalogStore'
import CatalogEntryDialog from './components/CatalogEntryDialog.vue'
import CatalogEntryDrawer from './components/CatalogEntryDrawer.vue'

const MAX_TAGS = 3

const store = useAdminCatalogStore()

const view = ref<CatalogView>('points')
const query = ref('')
/** the entry in the drawer */
const openId = ref<number>()
/** the entry that the dialog edits; `{}` is a new one, undefined means the dialog is closed */
const editing = ref<{ entry?: CatalogEntry }>()

const kind = computed(() => catalogKindOf(view.value))

/** Undefined while the list of the tab is not loaded yet. */
const entriesOf = (tab: CatalogView): CatalogEntry[] | undefined => {
	const list = store.lists[catalogKindOf(tab)]

	if (catalogKindOf(tab) !== 'point-types') return list

	return list?.filter((e) => e.isShared === (tab === 'shared'))
}

const tabs = computed(() =>
	catalogViews.map((tab) => ({ ...tab, count: entriesOf(tab.value)?.length })),
)

const entries = computed(() => entriesOf(view.value))

const holdersHead = computed(() => catalogHolders[view.value])

/** the unit forms of a point type carry a prefix each, a line apiece */
const stacksTags = computed(
	() => view.value === 'points' || view.value === 'shared',
)

/** the facts of a point type and of an item carry a prefix each, a line apiece */
const stacksFacts = computed(() => stacksTags.value || view.value === 'items')

const heads = computed(() => [
	...catalogHeads[view.value],
	...(holdersHead.value ? [holdersHead.value] : []),
])

const rows = computed(() =>
	filterCatalogEntries(entries.value ?? [], query.value).map((entry) => {
		const tags = catalogTags(view.value, entry)

		return {
			entry,
			tags: tags.slice(0, MAX_TAGS),
			moreTags: tags.length - MAX_TAGS,
			facts: catalogFacts(view.value, entry),
		}
	}),
)

const current = computed(() =>
	entries.value?.find((entry) => entry.id === openId.value),
)

const setDeleted = (entry: CatalogEntry, deleted: boolean) =>
	store.setDeleted(kind.value, entry, deleted)

const menuOf = (entry: CatalogEntry): RowMenuItem[] =>
	entry.deleted
		? [
				{
					label: 'Вернуть',
					icon: 'rotate-ccw',
					select: () => setDeleted(entry, false),
				},
			]
		: [
				{
					label: 'Изменить',
					icon: 'pencil',
					select: () => (editing.value = { entry }),
				},
				{
					label: 'Удалить',
					icon: 'trash-2',
					danger: true,
					select: () => setDeleted(entry, true),
				},
			]

watch(view, () => {
	editing.value = undefined
	openId.value = undefined
	query.value = ''
})

store.showDeleted = false

watch(() => store.showDeleted, store.loadAllCatalogs, { immediate: true })
</script>

<template>
	<div class="catalog">
		<div class="head">
			<UiPageTitle>Каталог</UiPageTitle>
			<div class="spacer"></div>
			<UiButton icon="plus" @click="editing = {}">Добавить</UiButton>
		</div>

		<UiTabs
			:model-value="view"
			:items="tabs"
			@update:model-value="view = $event as CatalogView"
		/>

		<div class="filters">
			<div class="filters__search">
				<UiInput
					v-model="query"
					compact
					icon="search"
					placeholder="Найти…"
					aria-label="Поиск"
				/>
			</div>
			<UiSwitch v-model="store.showDeleted" label="Показать удалённые" />
		</div>

		<div
			class="table"
			:class="{ 'table--holders': holdersHead }"
			role="table"
			aria-label="Записи каталога"
		>
			<div class="row row--head" role="row">
				<span
					v-for="(head, i) in heads"
					:key="head"
					role="columnheader"
					:class="{ holders: i === 3 }"
					>{{ head }}</span
				>
			</div>

			<UiRowMenu
				v-for="row in rows"
				:key="row.entry.id"
				class="row"
				:class="{
					'row--on': row.entry.id === openId,
					'row--dead': row.entry.deleted,
				}"
				role="row"
				label="Действия с записью"
				:items="menuOf(row.entry)"
			>
				<div class="cell cell--name" role="cell">
					<div class="name">
						<button
							class="name__button"
							type="button"
							@click="openId = row.entry.id"
						>
							{{ row.entry.name }}
						</button>
						<span v-if="row.entry.deleted" class="badge">удалён</span>
					</div>
					<span class="desc">{{
						row.entry.description || 'Без описания'
					}}</span>
				</div>

				<div
					class="cell cell--wrap"
					:class="{ 'cell--stack': stacksTags }"
					role="cell"
				>
					<span
						v-for="(tag, i) in row.tags"
						:key="i"
						class="tag"
						:class="`tag--${tag.tone}`"
						>{{ tag.text }}</span
					>
					<span v-if="row.moreTags > 0" class="tag">+{{ row.moreTags }}</span>
					<span v-if="!row.tags.length" class="muted">Очки не меняет</span>
				</div>

				<div
					class="cell cell--wrap"
					:class="{ 'cell--stack': stacksFacts }"
					role="cell"
				>
					<span v-for="fact in row.facts" :key="fact" class="fact">{{
						fact
					}}</span>
				</div>

				<span v-if="holdersHead" class="cell holders" role="cell">{{
					(row.entry.holdersTotal ?? 0).toLocaleString('ru-RU')
				}}</span>
			</UiRowMenu>

			<div v-if="entries && !rows.length" class="empty">
				{{ query.trim() ? 'Ничего не найдено.' : 'Пусто. Нажми «Добавить».' }}
			</div>
		</div>
	</div>

	<CatalogEntryDrawer
		v-if="current"
		:view
		:entry="current"
		@close="openId = undefined"
		@edit="editing = { entry: current }"
		@remove="setDeleted(current, true)"
		@restore="setDeleted(current, false)"
	/>

	<CatalogEntryDialog
		:open="!!editing"
		:kind="kind"
		:entry="editing?.entry"
		:shared="view === 'shared'"
		@close="editing = undefined"
	/>
</template>

<style scoped>
.catalog {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.head,
.filters {
	display: flex;
	align-items: center;
	gap: 16px;
}

.filters {
	gap: 24px;
}

.spacer {
	flex: 1;
}

.filters__search {
	width: 260px;
}

.table {
	/* the name takes what the fixed columns leave, so it is never narrower than they are */
	--columns: minmax(0, 1fr) 240px 200px;

	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.table--holders {
	--columns: minmax(0, 1fr) 240px 200px 92px;
}

/* 60px on the right belong to the «⋯» button */
.row {
	display: grid;
	grid-template-columns: var(--columns);
	gap: 16px;
	align-items: center;
	box-sizing: border-box;
	min-height: 72px;
	padding: 12px 60px 12px 20px;
	border-top: 1px solid var(--border-subtle);
}

.row--head {
	min-height: 0;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
	border-top: 0;
}

.row:not(.row--head):hover,
.row--on {
	background: var(--surface-sunken);
}

.row--on::before {
	content: '';
	position: absolute;
	top: 16px;
	bottom: 16px;
	left: 0;
	width: 3px;
	border-radius: 2px;
	background: var(--accent);
}

.row--dead .cell {
	opacity: 0.55;
}

.cell {
	min-width: 0;
}

.cell--name {
	display: flex;
	flex-direction: column;
	gap: 3px;
}

.cell--wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.cell--stack {
	flex-direction: column;
	align-items: flex-start;
}

.name {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.name__button {
	padding: 0;
	font: 600 15px / 1.35 var(--font-body);
	text-align: left;
	color: var(--text-strong);
	background: transparent;
	border: 0;
	cursor: pointer;
}

/* the whole row opens the drawer; the «⋯» button stays above it */
.name__button::after {
	content: '';
	position: absolute;
	inset: 0;
}

.desc {
	overflow: hidden;
	font: var(--type-caption);
	color: var(--text-muted);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.badge {
	display: inline-flex;
	align-items: center;
	height: 22px;
	padding: 0 8px;
	font: 700 11px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--danger-text);
	background: var(--danger-soft);
	border-radius: var(--radius-xs);
}

.tag,
.fact {
	display: inline-flex;
	align-items: center;
	box-sizing: border-box;
	max-width: 100%;
	min-height: 26px;
	padding: 5px 10px;
	font: 500 12px / 1.3 var(--font-body);
	color: var(--text-body);
	/* the fixed columns are narrow, a long change wraps inside its tag instead of running into the next column */
	overflow-wrap: anywhere;
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

.muted,
.empty {
	color: var(--text-muted);
}

.holders {
	font: 500 15px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
	text-align: right;
}

.row--head .holders {
	font: inherit;
	color: inherit;
}

.empty {
	padding: 20px;
	border-top: 1px solid var(--border-subtle);
}
</style>

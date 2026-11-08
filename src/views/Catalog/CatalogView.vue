<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CatalogEntry, CatalogKind, ResourceKind } from '../../api-facade/contracts'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiSwitch from '../../components/ui/UiSwitch.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import UiTag from '../../components/ui/UiTag.vue'
import { useAdminCatalogStore } from '../../stores/adminCatalogStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'
import { formatSpan } from '../../utils/format'
import CatalogEntryDialog from './components/CatalogEntryDialog.vue'

type PointsView = 'points' | 'shared'

type CatalogView = PointsView | ResourceKind

type Row = {
	entry: CatalogEntry
	/** the changes as tags in the second wide column, the point types have no such column */
	main?: string[]
	/** the narrow columns after it */
	extra: string[]
	notes: string[]
}

const store = useAdminCatalogStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const views = [
	{ value: 'points', label: 'Очки' },
	{ value: 'shared', label: 'Общие очки' },
	{ value: 'items', label: 'Предметы' },
	{ value: 'perks', label: 'Перки' },
	{ value: 'effects', label: 'Эффекты' },
]

const pointsHeads = ['Тип очков', 'Минимум', 'Максимум']

const heads: Record<CatalogView, string[]> = {
	points: pointsHeads,
	shared: pointsHeads,
	items: ['Предмет', 'Изменение', 'Использований'],
	perks: ['Перк', 'Эффект', 'Тип'],
	effects: ['Эффект', 'Изменение', 'Длительность'],
}

/** the admins see how many of the resource the users hold */
const holdersHeads: Partial<Record<CatalogView, string>> = {
	points: 'Всего у игроков',
	items: 'У игроков',
}

const view = ref<CatalogView>('points')
const query = ref('')
const openId = ref<number>()
/** the entry that the dialog edits; `{}` is a new one, undefined means the dialog is closed */
const editing = ref<{ entry?: CatalogEntry }>()

const catalogKind = computed<CatalogKind>(() => {
	const value = view.value

	return value === 'points' || value === 'shared' ? 'point-types' : value
})

/** the wide columns: the name, and the changes for everything but the point types */
const wide = computed(() => (view.value === 'points' || view.value === 'shared' ? 1 : 2))

const holdersHead = computed(() => (sessionStore.isAdmin ? holdersHeads[view.value] : undefined))

const headTitles = computed(() => [
	...heads[view.value],
	...(holdersHead.value ? [holdersHead.value] : []),
])

const columns = computed(() =>
	[
		...Array(wide.value).fill('minmax(0, 1.5fr)'),
		...Array(headTitles.value.length - wide.value).fill('140px'),
		...(sessionStore.isAdmin ? ['76px'] : []),
	].join(' '),
)

const detail = (entry: CatalogEntry): Pick<Row, 'main' | 'extra' | 'notes'> => {
	switch (view.value) {
		case 'points':
		case 'shared':
			return {
				extra: [String(entry.minimum ?? '—'), String(entry.maximum ?? '—')],
				notes: [
					`Стартовое значение: ${entry.startValue}`,
					...(sessionStore.isAdmin ? [`Единица в журнале: ${entry.unitForms && Object.values(entry.unitForms).join(' / ')}`] : []),
				],
			}
		case 'items':
			return { main: entry.changes ?? [], extra: [String(entry.usesMax ?? 1)], notes: [] }
		case 'perks':
			return {
				main: entry.changes ?? [],
				extra: [entry.perkKind === 'active' ? 'активный' : 'пассивный'],
				notes: [],
			}
		case 'effects':
			return {
				main: entry.changes ?? [],
				extra: [entry.duration ? formatSpan(entry.duration) : '—'],
				notes: [],
			}
	}
}

/**
 * The admins get their own list with the deleted entries, the users get the one without them.
 * Undefined while the list of the open tab is not loaded yet, the previous tab's list is no answer.
 */
const entries = computed<CatalogEntry[] | undefined>(() => {
	const kind = catalogKind.value

	const list = sessionStore.isAdmin
		? store.entriesKind === kind
			? store.entries
			: undefined
		: kind === 'point-types'
			? resourcesStore.pointTypes.map((type) => ({ ...type, deleted: false }))
			: resourcesStore.catalogEntries[kind]

	return kind === 'point-types'
		? list?.filter((e) => e.isShared === (view.value === 'shared'))
		: list
})

const rows = computed<Row[]>(() => {
	const q = query.value.trim().toLowerCase()

	return (entries.value ?? [])
		.map((entry) => {
			const row = detail(entry)

			return {
				...row,
				entry,
				extra: [...row.extra, ...(holdersHead.value ? [String(entry.holdersTotal ?? 0)] : [])],
			}
		})
		.filter(
			(row) =>
				!q ||
				[row.entry.name, row.entry.description, ...(row.main ?? [])].some((s) =>
					s.toLowerCase().includes(q),
				),
		)
})

watch(
	view,
	() => {
		openId.value = undefined
		editing.value = undefined
		query.value = ''
		store.showDeleted = false
	},
	{ immediate: true },
)

watch(
	[catalogKind, () => store.showDeleted, () => sessionStore.isAdmin],
	() => {
		const kind = catalogKind.value

		if (sessionStore.isAdmin) store.loadCatalog(kind)
		else if (kind !== 'point-types') resourcesStore.loadCatalogEntries(kind)
	},
	{ immediate: true },
)
</script>

<template>
	<div class="catalog">
		<div class="head">
			<UiPageTitle>Каталог</UiPageTitle>
			<div class="head__spacer"></div>
			<div class="head__search">
				<UiInput v-model="query" compact icon="search" placeholder="Найти…" aria-label="Поиск" />
			</div>
			<template v-if="sessionStore.isAdmin">
				<UiSwitch v-model="store.showDeleted" label="Показать удалённые" />
				<UiButton icon="plus" @click="editing = {}">Добавить</UiButton>
			</template>
		</div>

		<UiTabs
			:model-value="view"
			:items="views"
			@update:model-value="view = $event as CatalogView"
		/>

		<div class="table" :style="{ '--columns': columns }">
			<div class="table__row table__row--head">
				<span class="table__name-head">{{ headTitles[0] }}</span>
				<span v-for="head in headTitles.slice(1)" :key="head">{{ head }}</span>
				<span v-if="sessionStore.isAdmin"></span>
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

					<div v-if="row.main" class="tags" :class="{ 'cell--dead': row.entry.deleted }">
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

					<span v-if="sessionStore.isAdmin" class="table__actions">
						<template v-if="!row.entry.deleted">
							<UiIconButton
								icon="pencil"
								size="sm"
								label="Изменить"
								@click.stop="editing = { entry: row.entry }"
							/>
							<UiIconButton
								icon="trash-2"
								size="sm"
								label="Удалить"
								@click.stop="store.setDeleted(catalogKind, row.entry, true)"
							/>
						</template>
						<UiIconButton
							v-else
							icon="rotate-ccw"
							size="sm"
							label="Вернуть"
							@click.stop="store.setDeleted(catalogKind, row.entry, false)"
						/>
					</span>
				</div>

				<div v-if="openId === row.entry.id" class="item__desc">
					<span class="label">Описание</span>
					<span class="text">{{ row.entry.description || 'Без описания' }}</span>
					<span v-for="note in row.notes" :key="note" class="item__note">{{ note }}</span>
				</div>
			</div>

			<div v-if="entries && !rows.length" class="table__empty">
				{{
					query.trim()
						? 'Ничего не найдено.'
						: sessionStore.isAdmin
							? 'Пусто. Нажми «Добавить».'
							: 'Пока ничего нет.'
				}}
			</div>
		</div>
	</div>

	<CatalogEntryDialog
		v-if="sessionStore.isAdmin"
		:open="!!editing"
		:kind="catalogKind"
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

.head {
	display: flex;
	align-items: center;
	gap: 20px;
}

.head__spacer {
	flex: 1;
}

.head__search {
	width: 260px;
}

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

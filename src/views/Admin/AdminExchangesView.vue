<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AdminExchange, SpinCostRow } from '../../api-facade/contracts'
import type {
	FormRow,
	FormSection,
	FormValues,
} from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiRowMenu, { type RowMenuItem } from '../../components/ui/UiRowMenu.vue'
import { useAdminCatalogStore } from '../../stores/adminCatalogStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useToastStore } from '../../stores/toastStore'
import { formatResource } from '../../utils/formatResource'
import { plural } from '../../utils/plural'
import { changeRowsToForm, parseCostRows } from '../../utils/formRows'
import AdminListHeader from './components/AdminListHeader.vue'

const store = useAdminCatalogStore()
const resourcesStore = useResourcesStore()
const toastStore = useToastStore()

/** the exchange that the dialog edits; `{}` is a new one, undefined means the dialog is closed */
const editing = ref<{ exchange?: AdminExchange }>()

/** the two sides with a sign between them, and under each its own switch */
const sides = 'minmax(0, 1fr) 40px minmax(0, 1fr)'

const sections: FormSection[] = [
	{
		fields: [
			{
				key: 'name',
				label: 'Название',
				required: 'название',
				placeholder: 'Набор для рерола',
			},
			{
				key: 'description',
				label: 'Описание',
				optional: true,
				placeholder: 'Что даёт и когда пригодится',
			},
		],
	},
	{
		columns: sides,
		fields: [
			{
				key: 'sourceEntries',
				label: 'Игрок отдаёт',
				required: 'отдаваемый ресурс',
				type: 'rows',
				variant: 'cost',
				addLabel: 'Ресурс',
			},
			{ key: 'arrow', label: '', type: 'arrow' },
			{
				key: 'targetEntries',
				label: 'Игрок получает',
				required: 'получаемый ресурс',
				type: 'rows',
				variant: 'cost',
				addLabel: 'Ресурс',
			},
			{
				key: 'chooseSource',
				type: 'check',
				label: 'Игрок выбирает, что отдать',
			},
			{
				key: 'chooseTarget',
				type: 'check',
				label: 'Игрок выбирает, что получить',
				column: 3,
			},
		],
	},
]

const sideRows = (refs: AdminExchange['sourceEntries']): FormRow[] =>
	changeRowsToForm(
		refs.map(
			(r): SpinCostRow => ({
				kind: r.kind,
				targetId: r.id,
				amount: 'amount' in r ? r.amount : 1,
			}),
		),
	)

const initial = computed<FormValues>(() => ({
	name: editing.value?.exchange?.name ?? '',
	description: editing.value?.exchange?.description ?? '',
	sourceEntries: sideRows(editing.value?.exchange?.sourceEntries ?? []),
	targetEntries: sideRows(editing.value?.exchange?.targetEntries ?? []),
	chooseSource: editing.value?.exchange?.sourceShouldApplyToAll === false,
	chooseTarget: editing.value?.exchange?.targetShouldApplyToAll === false,
}))

const side = (refs: AdminExchange['sourceEntries']) =>
	refs.length
		? refs.map((r) => formatResource(r, resourcesStore.pointTypes))
		: ['—']

const query = ref('')

const found = computed(() => {
	const q = query.value.trim().toLowerCase()

	return store.exchanges.filter(
		(x) =>
			!q ||
			x.name.toLowerCase().includes(q) ||
			x.description.toLowerCase().includes(q),
	)
})

const rows = computed(() =>
	found.value.map((exchange) => ({
		exchange,
		give: side(exchange.sourceEntries),
		get: side(exchange.targetEntries),
	})),
)

const count = computed(
	() =>
		`${rows.value.length} ${plural(rows.value.length, ['обмен', 'обмена', 'обменов'])}`,
)

const menuOf = (exchange: AdminExchange): RowMenuItem[] =>
	exchange.deleted
		? [
				{
					label: 'Вернуть',
					icon: 'rotate-ccw',
					select: () => store.setExchangeDeleted(exchange, false),
				},
			]
		: [
				{
					label: 'Изменить',
					icon: 'pencil',
					select: () => (editing.value = { exchange }),
				},
				{
					label: 'Удалить',
					icon: 'trash-2',
					danger: true,
					select: () => store.setExchangeDeleted(exchange, true),
				},
			]

const onSave = async (values: FormValues) => {
	const name = String(values.name).trim()
	const sourceEntries = parseCostRows(values.sourceEntries as FormRow[])
	const targetEntries = parseCostRows(values.targetEntries as FormRow[])

	if ('error' in sourceEntries || 'error' in targetEntries) {
		toastStore.show(
			'Проверь стороны обмена',
			'error' in sourceEntries
				? sourceEntries.error
				: (targetEntries as { error: string }).error,
			'danger',
		)
		return
	}

	const input = {
		name,
		description: String(values.description).trim(),
		sourceEntries: sourceEntries.value,
		sourceShouldApplyToAll: values.chooseSource !== true,
		targetEntries: targetEntries.value,
		targetShouldApplyToAll: values.chooseTarget !== true,
	}

	if (await store.saveExchange(editing.value?.exchange?.id, input)) {
		editing.value = undefined
	}
}

store.showDeleted = false

watch(
	() => store.showDeleted,
	() => store.loadExchanges(),
	{ immediate: true },
)
</script>

<template>
	<div class="exchanges">
		<AdminListHeader
			v-model:show-deleted="store.showDeleted"
			v-model:query="query"
			title="Обмены"
			:count
			placeholder="Найти обмен…"
			@add="editing = {}"
		/>

		<div class="table" role="table" aria-label="Обмены">
			<div class="row row--head" role="row">
				<span role="columnheader">Обмен</span>
				<span role="columnheader">Что на что</span>
			</div>

			<UiRowMenu
				v-for="row in rows"
				:key="row.exchange.id"
				class="row"
				:class="{ 'row--dead': row.exchange.deleted }"
				role="row"
				label="Действия с обменом"
				:items="menuOf(row.exchange)"
			>
				<div class="cell cell--name" role="cell">
					<span class="name">
						<span class="name__title">{{ row.exchange.name }}</span>
						<UiBadge v-if="row.exchange.deleted">удалён</UiBadge>
					</span>
					<span class="desc">{{ row.exchange.description }}</span>
				</div>

				<div class="cell sides" role="cell">
					<div class="side">
						<span class="side__head">
							<span class="side__label">Отдаёт</span>
							<UiBadge v-if="!row.exchange.sourceShouldApplyToAll" tone="info"
								>игрок выбирает</UiBadge
							>
						</span>
						<span class="pills">
							<span v-for="(pill, i) in row.give" :key="i" class="pill">{{
								pill
							}}</span>
						</span>
					</div>

					<span class="sides__arrow">
						<UiIcon name="arrow-left-right" :size="20" />
					</span>

					<div class="side">
						<span class="side__head">
							<span class="side__label">Получает</span>
							<UiBadge v-if="!row.exchange.targetShouldApplyToAll" tone="info"
								>игрок выбирает</UiBadge
							>
						</span>
						<span class="pills">
							<span
								v-for="(pill, i) in row.get"
								:key="i"
								class="pill pill--get"
								>{{ pill }}</span
							>
						</span>
					</div>
				</div>
			</UiRowMenu>

			<div v-if="!rows.length" class="empty">
				{{
					query.trim() ? 'Ничего не найдено.' : 'Обменов нет. Нажми «Добавить».'
				}}
			</div>
		</div>
	</div>

	<FormDialog
		:open="!!editing"
		:title="
			editing?.exchange ? `Изменить «${editing.exchange.name}»` : 'Новый обмен'
		"
		:submit-label="editing?.exchange ? 'Сохранить' : 'Создать обмен'"
		:width="840"
		:sections
		:initial
		@close="editing = undefined"
		@save="onSave"
	/>
</template>

<style scoped>
.exchanges {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

/* 60px on the right belong to the «⋯» button */
.row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
	gap: 16px;
	align-items: start;
	padding: 16px 60px 16px 20px;
	border-top: 1px solid var(--border-subtle);
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

.row:not(.row--head):hover {
	background: var(--surface-sunken);
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
	gap: 4px;
}

.name {
	display: flex;
	align-items: center;
	gap: 8px;
}

.name__title {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.desc {
	font: var(--type-caption);
	color: var(--text-muted);
}

.sides {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
	gap: 12px;
	align-items: start;
}

/* level with the pills, under the side labels */
.sides__arrow {
	display: flex;
	justify-content: center;
	padding-top: 26px;
	color: var(--text-subtle);
}

.side {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

.side__head {
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 22px;
}

.side__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.pills {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.pill {
	display: flex;
	align-items: center;
	box-sizing: border-box;
	max-width: 100%;
	min-height: 28px;
	padding: 4px 12px;
	font: 500 13px / 1.3 var(--font-body);
	color: var(--text-strong);
	border: var(--border-width) solid var(--border-strong);
	border-radius: var(--radius-pill);
}

.pill--get {
	font-weight: 600;
	background: var(--surface-sunken);
	border: 0;
}

.empty {
	padding: 16px 20px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}
</style>

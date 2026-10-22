<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AdminExchange } from '../../api-facade/contracts'
import type { FormField, FormValues } from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import { useAdminCatalogStore } from '../../stores/adminCatalogStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useToastStore } from '../../stores/toastStore'
import { formatResource } from '../../utils/formatResource'
import AdminListHeader from './components/AdminListHeader.vue'

const store = useAdminCatalogStore()
const resourcesStore = useResourcesStore()
const toastStore = useToastStore()

/** the exchange that the dialog edits; `{}` is a new one, undefined means the dialog is closed */
const editing = ref<{ exchange?: AdminExchange }>()

const fields: FormField[] = [
	{ key: 'name', label: 'Название', placeholder: 'Набор для рерола' },
	{ key: 'description', label: 'Описание', placeholder: 'Что даёт и когда пригодится' },
]

const initial = computed<FormValues>(() => ({
	name: editing.value?.exchange?.name ?? '',
	description: editing.value?.exchange?.description ?? '',
}))

const side = (refs: AdminExchange['sourceEntries']) =>
	refs.length ? refs.map((r) => formatResource(r, resourcesStore.pointTypes)) : ['—']

const query = ref('')

const found = computed(() => {
	const q = query.value.trim().toLowerCase()

	return store.exchanges.filter(
		(x) => !q || x.name.toLowerCase().includes(q) || x.description.toLowerCase().includes(q),
	)
})

const rows = computed(() =>
	found.value.map((exchange) => ({
		exchange,
		give: side(exchange.sourceEntries),
		get: side(exchange.targetEntries),
	})),
)

const onSave = async (values: FormValues) => {
	const name = String(values.name).trim()

	if (!name) {
		toastStore.show('Впиши название', 'Без него не сохранится.', 'danger')
		return
	}

	const input = { name, description: String(values.description).trim() }

	if (await store.saveExchange(editing.value?.exchange?.id, input)) {
		editing.value = undefined
	}
}

store.showDeleted = false

watch(() => store.showDeleted, () => store.loadExchanges(), { immediate: true })
</script>

<template>
	<div class="exchanges">
		<AdminListHeader
			v-model:show-deleted="store.showDeleted"
			v-model:query="query"
			title="Обмены"
			@add="editing = {}"
		/>

		<div class="table">
			<div class="table__row table__row--head">
				<span>Обмен</span>
				<span>Отдаёшь</span>
				<span></span>
				<span>Получаешь</span>
				<span></span>
			</div>

			<div v-for="row in rows" :key="row.exchange.id" class="table__row table__row--body">
				<div class="cell cell--name" :class="{ 'cell--dead': row.exchange.deleted }">
					<span class="cell__head">
						<span class="cell__title">{{ row.exchange.name }}</span>
						<UiBadge v-if="row.exchange.deleted">удалён</UiBadge>
					</span>
					<span class="cell__desc">{{ row.exchange.description }}</span>
				</div>

				<div class="pills" :class="{ 'cell--dead': row.exchange.deleted }">
					<span v-for="(pill, i) in row.give" :key="i" class="pill">{{ pill }}</span>
				</div>

				<span class="table__arrow">
					<UiIcon name="arrow-left-right" :size="18" />
				</span>

				<div class="pills" :class="{ 'cell--dead': row.exchange.deleted }">
					<span v-for="(pill, i) in row.get" :key="i" class="pill pill--get">{{ pill }}</span>
				</div>

				<span class="table__actions">
					<template v-if="!row.exchange.deleted">
						<UiIconButton
							icon="pencil"
							size="sm"
							label="Изменить"
							@click="editing = { exchange: row.exchange }"
						/>
						<UiIconButton
							icon="trash-2"
							size="sm"
							label="Удалить"
							@click="store.setExchangeDeleted(row.exchange, true)"
						/>
					</template>
					<UiIconButton
						v-else
						icon="rotate-ccw"
						size="sm"
						label="Вернуть"
						@click="store.setExchangeDeleted(row.exchange, false)"
					/>
				</span>
			</div>

			<div v-if="!rows.length" class="table__empty">Обменов нет. Нажми «Добавить».</div>
		</div>

		<span class="note">
			Обе стороны — список изменений, как в «Выдать». Удалённый обмен скрывается у игроков,
			история сохраняется.
		</span>
	</div>

	<FormDialog
		:open="!!editing"
		:title="editing?.exchange ? `Изменить «${editing.exchange.name}»` : 'Новый обмен'"
		:fields
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

.table__row {
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.4fr) 24px minmax(0, 1.4fr) 76px;
	gap: 12px;
	align-items: center;
	padding: 12px 16px;
}

.table__row--head {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__row--body {
	border-top: 1px solid var(--border-subtle);
}

.table__arrow {
	display: flex;
	justify-content: center;
	color: var(--text-subtle);
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

.cell--dead {
	opacity: 0.5;
}

.cell--name {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.cell__head {
	display: flex;
	align-items: center;
	gap: 8px;
}

.cell__title {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.cell__desc {
	font: var(--type-caption);
	color: var(--text-muted);
}

.pills {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.pill {
	display: flex;
	flex: none;
	align-items: center;
	height: 28px;
	padding: 0 12px;
	font: 500 13px / 1 var(--font-body);
	color: var(--text-strong);
	white-space: nowrap;
	border: var(--border-width) solid var(--border-strong);
	border-radius: var(--radius-pill);
}

.pill--get {
	font-weight: 600;
	background: var(--surface-sunken);
	border: 0;
}

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
}
</style>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type {
	AdminWheelGroup,
	CatalogEntry,
	SpinCostRow,
} from '../../../api-facade/contracts'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiSelect from '../../../components/ui/UiSelect.vue'
import { useAdminCatalogStore } from '../../../stores/adminCatalogStore'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'
import { useToastStore } from '../../../stores/toastStore'

type Kind = SpinCostRow['kind']
type Row = { kind: Kind; targetId: number; amount: string }

const { group } = defineProps<{ group: AdminWheelGroup }>()

const catalogStore = useAdminCatalogStore()
const store = useAdminWheelStore()
const toastStore = useToastStore()

const rows = reactive<Row[]>([])
const targets = ref<Record<Kind, CatalogEntry[]>>({
	points: [],
	item: [],
	perk: [],
	effect: [],
})

const kindOptions = [
	{ value: 'points', label: 'Очки' },
	{ value: 'item', label: 'Предмет' },
	{ value: 'perk', label: 'Перк' },
	{ value: 'effect', label: 'Эффект' },
]

const targetOptions = (kind: Kind) =>
	targets.value[kind].map((t) => ({ value: String(t.id), label: t.name }))

const onKind = (row: Row, kind: string) => {
	row.kind = kind as Kind
	row.targetId = targets.value[row.kind][0]?.id ?? 0
}

const addRow = () =>
	rows.push({
		kind: 'item',
		targetId: targets.value.item[0]?.id ?? 0,
		amount: '1',
	})

const fill = (cost: SpinCostRow[]) =>
	rows.splice(
		0,
		rows.length,
		...cost.map((r) => ({ ...r, amount: String(r.amount) })),
	)

const save = async (list: Row[]) => {
	const parsed = list.map((row) => ({ ...row, amount: Number(row.amount) }))

	if (parsed.some((row) => !Number.isInteger(row.amount) || row.amount <= 0)) {
		toastStore.show(
			'Проверь количество',
			'Нужно целое число больше нуля.',
			'danger',
		)
		return
	}

	// a perk or an effect is held once, so it can only be taken once
	if (
		parsed.some(
			(row) =>
				(row.kind === 'perk' || row.kind === 'effect') && row.amount !== 1,
		)
	) {
		toastStore.show(
			'Проверь количество',
			'Перк или эффект у игрока один: нужно 1.',
			'danger',
		)
		return
	}

	if (await store.saveSpinCost(group, parsed)) fill(parsed)
}

const onClear = async () => {
	if (await store.saveSpinCost(group, [])) rows.splice(0, rows.length)
}

onMounted(async () => {
	const [points, items, perks, effects, cost] = await Promise.all([
		catalogStore.fetchCatalog('point-types'),
		catalogStore.fetchCatalog('items'),
		catalogStore.fetchCatalog('perks'),
		catalogStore.fetchCatalog('effects'),
		store.loadSpinCost(group),
	])

	targets.value = { points, item: items, perk: perks, effect: effects }
	fill(cost)
})
</script>

<template>
	<div class="card">
		<span class="card__label">Цена прокрута</span>

		<div v-for="(row, i) in rows" :key="i" class="row">
			<UiSelect
				:options="kindOptions"
				:model-value="row.kind"
				aria-label="Тип"
				@update:model-value="onKind(row, $event)"
			/>
			<UiSelect
				:options="targetOptions(row.kind)"
				:model-value="String(row.targetId)"
				aria-label="Что"
				@update:model-value="row.targetId = Number($event)"
			/>
			<UiInput v-model="row.amount" inputmode="numeric" aria-label="Сколько" />
			<UiIconButton
				icon="x"
				size="sm"
				label="Убрать строку"
				@click="rows.splice(i, 1)"
			/>
		</div>

		<span v-if="!rows.length" class="card__empty">Прокрут бесплатный.</span>

		<div class="card__actions">
			<UiButton variant="ghost" size="sm" icon="plus" @click="addRow"
				>Добавить строку</UiButton
			>
			<UiButton variant="ghost" size="sm" class="card__danger" @click="onClear">
				Сделать бесплатным
			</UiButton>
			<div class="card__spacer"></div>
			<UiButton variant="secondary" icon="check" @click="save(rows)"
				>Сохранить</UiButton
			>
		</div>
	</div>
</template>

<style scoped>
.card {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.card__empty {
	font: var(--type-body-sm);
	color: var(--text-subtle);
}

.card__actions {
	display: flex;
	align-items: center;
	gap: 8px;
	padding-top: 12px;
	border-top: 1px solid var(--border-subtle);
}

.card__spacer {
	flex: 1;
}

.card .card__danger {
	color: var(--danger-text);
}

.row {
	display: grid;
	grid-template-columns: 160px minmax(0, 1fr) 120px 32px;
	gap: 8px;
	align-items: center;
}
</style>

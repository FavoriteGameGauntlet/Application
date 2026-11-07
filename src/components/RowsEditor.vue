<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ChangeRow } from '../api-facade/contracts'
import { useAdminCatalogStore } from '../stores/adminCatalogStore'
import type { FormRow, RowsVariant } from './formDialog'
import UiButton from './ui/UiButton.vue'
import UiIconButton from './ui/UiIconButton.vue'
import UiInput from './ui/UiInput.vue'
import UiSelect from './ui/UiSelect.vue'

type Props = {
	variant: RowsVariant
	label: string
	hint?: string
}

const { variant } = defineProps<Props>()

const rows = defineModel<FormRow[]>({ required: true })

const store = useAdminCatalogStore()

type TargetKind = ChangeRow['kind']

const kindLabels: Record<TargetKind, string> = {
	points: 'Очки',
	item: 'Предмет',
	perk: 'Перк',
	effect: 'Эффект',
}

const kindOptions = computed(() => [
	...(variant === 'modifier'
		? [{ value: 'points', label: kindLabels.points }]
		: (Object.keys(kindLabels) as TargetKind[]).map((k) => ({
				value: k,
				label: kindLabels[k],
			}))),
	...(variant === 'item-entry'
		? [{ value: 'user-item', label: 'Выбранный предмет' }]
		: []),
])

const whoOptions = [
	{ value: 'self', label: 'Тому, кто использует' },
	{ value: 'chosen', label: 'Выбранным игрокам' },
]

const targetOptions = (kind: string) =>
	(store.targets[kind as TargetKind] ?? []).map((t) => ({
		value: String(t.id),
		label: t.name,
	}))

const firstTarget = (kind: string) => store.targets[kind as TargetKind]?.[0]?.id

const addRow = () => {
	const kind =
		variant === 'modifier' ? 'points' : variant === 'cost' ? 'item' : 'points'

	rows.value.push({
		kind,
		targetId: String(firstTarget(kind) ?? ''),
		amount: '1',
		who: 'self',
	})
}

const onKind = (row: FormRow, kind: string) => {
	row.kind = kind
	row.targetId = kind === 'user-item' ? '' : String(firstTarget(kind) ?? '')
	// a perk or an effect is held once; a taken one keeps its minus
	if (kind === 'perk' || kind === 'effect') {
		row.amount = row.amount.trim().startsWith('-') ? '-1' : '1'
	}
}

const amountLabel = computed(() =>
	variant === 'cost' ? 'Сколько' : 'Сколько (минус — забрать)',
)

onMounted(() => store.loadTargets())
</script>

<template>
	<div class="rows">
		<span class="rows__label">{{ label }}</span>

		<div v-for="(row, i) in rows" :key="i" class="row">
			<div
				class="row__main"
				:class="{ 'row__main--wide': row.kind === 'user-item' }"
			>
				<UiSelect
					v-if="variant !== 'modifier'"
					compact
					:options="kindOptions"
					:model-value="row.kind"
					aria-label="Тип"
					@update:model-value="onKind(row, $event)"
				/>
				<UiSelect
					v-if="row.kind !== 'user-item'"
					compact
					:options="targetOptions(row.kind)"
					:model-value="row.targetId"
					:placeholder="targetOptions(row.kind).length ? undefined : 'Пока нет'"
					aria-label="Что"
					@update:model-value="row.targetId = $event"
				/>
				<UiInput
					v-model="row.amount"
					compact
					inputmode="numeric"
					:aria-label="amountLabel"
				/>
				<UiIconButton
					type="button"
					icon="x"
					size="sm"
					label="Убрать строку"
					@click="rows.splice(i, 1)"
				/>
			</div>

			<UiSelect
				v-if="variant === 'item-entry'"
				compact
				:options="whoOptions"
				:model-value="row.who"
				aria-label="Кому"
				@update:model-value="row.who = $event as FormRow['who']"
			/>
		</div>

		<UiButton
			type="button"
			variant="ghost"
			size="sm"
			icon="plus"
			@click="addRow"
		>
			Добавить строку
		</UiButton>

		<span v-if="hint" class="rows__hint">{{ hint }}</span>
	</div>
</template>

<style scoped>
.rows {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
}

.rows__label {
	font: var(--type-label);
	color: var(--text-muted);
}

.rows__hint {
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}

.row {
	display: flex;
	flex-direction: column;
	gap: 6px;
	align-self: stretch;
}

.row__main {
	display: grid;
	grid-template-columns: 110px minmax(0, 1fr) 76px 32px;
	gap: 8px;
	align-items: center;
}

/* no target select: a user item has no catalogue entry */
.row__main--wide {
	grid-template-columns: 150px minmax(0, 1fr) 76px 32px;
}

.row__main--wide > :nth-child(2) {
	grid-column: 2;
}
</style>

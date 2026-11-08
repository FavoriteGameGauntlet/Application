<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { CatalogEntry, RewardRow, Rewards } from '../../api-facade/contracts'
import type { FormRow } from '../../components/formDialog'
import { changeRowsToForm, parseChangeRows } from '../../utils/formRows'
import { useToastStore } from '../../stores/toastStore'
import UiButton from '../../components/ui/UiButton.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import { useAdminCatalogStore } from '../../stores/adminCatalogStore'
import { useAdminSettingsStore } from '../../stores/adminSettingsStore'

type Kind = RewardRow['kind']
type Block = keyof Rewards

/** the parameter that holds the length of the timer */

const catalogStore = useAdminCatalogStore()
const settingsStore = useAdminSettingsStore()

const toastStore = useToastStore()

/** the rows as the admin types them */
const draft = reactive<Record<Block, FormRow[]>>({ timer: [], game: [] })
const targets = ref<Record<Kind, CatalogEntry[]>>({ points: [], item: [], perk: [], effect: [] })

const kindOptions = [
	{ value: 'points', label: 'Очки' },
	{ value: 'item', label: 'Предмет' },
	{ value: 'perk', label: 'Перк' },
	{ value: 'effect', label: 'Эффект' },
]

const defaultAmounts: Record<Kind, string> = { points: '10', item: '1', perk: '1', effect: '1' }

const blocks = computed<{ key: Block; title: string; next: string }[]>(() => [
	{
		key: 'timer',
		title: 'За завершённый таймер',
		next: 'Действуют на следующие таймеры.',
	},
	{ key: 'game', title: 'За завершение игры', next: 'Действуют на следующие игры.' },
])

const targetOptions = (kind: Kind) =>
	targets.value[kind].map((t) => ({ value: String(t.id), label: t.name }))

const onKind = (row: FormRow, kind: string) => {
	row.kind = kind
	row.targetId = String(targets.value[kind as Kind][0]?.id ?? '')
	row.amount = defaultAmounts[kind as Kind]
}

const addRow = (key: Block) =>
	draft[key].push({
		kind: 'points',
		targetId: String(targets.value.points[0]?.id ?? ''),
		amount: defaultAmounts.points,
		who: 'self',
	})

/** a block is saved on its own, the other one keeps what is stored */
const payload = (key: Block, rows: RewardRow[]): Rewards => ({
	...settingsStore.rewards,
	[key]: rows,
})

const onSave = (block: { key: Block; next: string }) => {
	const rows = parseChangeRows(draft[block.key])

	if ('error' in rows) {
		toastStore.show('Проверь награду', rows.error, 'danger')
		return
	}

	return settingsStore.saveRewards(
		payload(block.key, rows.value),
		'Награды сохранены',
		block.next,
	)
}

const onClear = async (block: { key: Block; title: string }) => {
	draft[block.key] = []

	await settingsStore.saveRewards(
		payload(block.key, []),
		'Награда убрана',
		block.title,
		'info',
	)
}

onMounted(async () => {
	const [points, items, perks, effects] = await Promise.all([
		catalogStore.fetchCatalog('point-types'),
		catalogStore.fetchCatalog('items'),
		catalogStore.fetchCatalog('perks'),
		catalogStore.fetchCatalog('effects'),
		settingsStore.loadRewards(),
	])

	targets.value = { points, item: items, perk: perks, effect: effects }
	draft.timer = changeRowsToForm(settingsStore.rewards.timer)
	draft.game = changeRowsToForm(settingsStore.rewards.game)
})
</script>

<template>
	<div class="rewards">
		<UiPageTitle>Награды</UiPageTitle>

		<div v-for="block in blocks" :key="block.key" class="card">
			<span class="card__label">{{ block.title }}</span>

			<div v-for="(row, i) in draft[block.key]" :key="i" class="row">
				<UiSelect
					:options="kindOptions"
					:model-value="row.kind"
					aria-label="Тип"
					@update:model-value="onKind(row, $event)"
				/>
				<UiSelect
					:options="targetOptions(row.kind as Kind)"
					:model-value="row.targetId"
					aria-label="Что"
					@update:model-value="row.targetId = $event"
				/>
				<UiInput v-model="row.amount" inputmode="numeric" aria-label="Сколько" />
				<UiIconButton
					icon="x"
					size="sm"
					label="Убрать строку"
					@click="draft[block.key].splice(i, 1)"
				/>
			</div>

			<span v-if="!draft[block.key].length" class="card__empty">Награды нет.</span>

			<div class="card__actions">
				<UiButton variant="ghost" size="sm" icon="plus" @click="addRow(block.key)">
					Добавить строку
				</UiButton>
				<UiButton variant="ghost" size="sm" class="card__danger" @click="onClear(block)">
					Убрать награду
				</UiButton>
				<div class="card__spacer"></div>
				<UiButton variant="secondary" icon="check" @click="onSave(block)">Сохранить</UiButton>
			</div>
		</div>

		<span class="note">
			Длительность таймера меняется в «Системных параметрах». Новая награда действует только на
			следующие таймеры и игры, уже выданные не пересчитываются.
		</span>
	</div>
</template>

<style scoped>
.rewards {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 760px;
}

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

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}
</style>

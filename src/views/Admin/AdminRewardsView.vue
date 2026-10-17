<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { CatalogEntry, RewardRow, Rewards } from '../../api-facade/contracts'
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
const TIMER_DURATION_KEY = 'timer.duration'

const catalogStore = useAdminCatalogStore()
const settingsStore = useAdminSettingsStore()

const draft = reactive<Rewards>({ timer: [], game: [] })
const targets = ref<Record<Kind, CatalogEntry[]>>({ points: [], item: [], effect: [] })

const kindOptions = [
	{ value: 'points', label: 'Очки' },
	{ value: 'item', label: 'Предмет' },
	{ value: 'effect', label: 'Эффект' },
]

const defaultAmounts: Record<Kind, string> = { points: '+10', item: '+1', effect: '1 день' }

const timerDuration = computed(
	() => settingsStore.params.find((p) => p.key === TIMER_DURATION_KEY)?.value ?? '',
)

const blocks = computed<{ key: Block; title: string; next: string }[]>(() => [
	{
		key: 'timer',
		title: `За завершённый таймер (${timerDuration.value})`,
		next: 'Действуют на следующие таймеры.',
	},
	{ key: 'game', title: 'За завершение игры', next: 'Действуют на следующие игры.' },
])

const targetOptions = (kind: Kind) =>
	targets.value[kind].map((t) => ({ value: String(t.id), label: t.name }))

const onKind = (row: RewardRow, kind: string) => {
	row.kind = kind as Kind
	row.targetId = targets.value[row.kind][0]?.id ?? 0
	row.amount = defaultAmounts[row.kind]
}

const addRow = (key: Block) =>
	draft[key].push({
		kind: 'points',
		targetId: targets.value.points[0]?.id ?? 0,
		amount: defaultAmounts.points,
	})

/** a block is saved on its own, the other one keeps what is stored */
const payload = (key: Block, rows: RewardRow[]): Rewards => ({
	...settingsStore.rewards,
	[key]: rows,
})

const onSave = (block: { key: Block; next: string }) =>
	settingsStore.saveRewards(
		payload(block.key, draft[block.key]),
		'Награды сохранены',
		block.next,
	)

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
	const [points, items, effects] = await Promise.all([
		catalogStore.fetchCatalog('point-types'),
		catalogStore.fetchCatalog('items'),
		catalogStore.fetchCatalog('effects'),
		settingsStore.loadRewards(),
		settingsStore.loadParams(),
	])

	targets.value = { points, item: items, effect: effects }
	draft.timer = structuredClone(settingsStore.rewards.timer)
	draft.game = structuredClone(settingsStore.rewards.game)
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
					:options="targetOptions(row.kind)"
					:model-value="String(row.targetId)"
					aria-label="Что"
					@update:model-value="row.targetId = Number($event)"
				/>
				<UiInput v-model="row.amount" aria-label="Сколько" />
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
			Длительность таймера меняется в «Сист. параметрах». Новая награда действует только на
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

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { CatalogOption, ChangeRow } from '../api-facade/contracts'
import { useAdminCatalogStore } from '../stores/adminCatalogStore'
import type { FormRow, RowsVariant } from './formDialog'
import UiFormSection from './ui/UiFormSection.vue'
import UiIconButton from './ui/UiIconButton.vue'
import type { OptionGroup } from './ui/UiOptionList.vue'
import UiPicker from './ui/UiPicker.vue'

type Props = {
	variant: RowsVariant
	label: string
	hint?: string
	/** what the rows are for, shown while there are none */
	empty?: string
	/** the text of the "+" link */
	addLabel?: string
}

const { variant, addLabel = 'Строка' } = defineProps<Props>()

const rows = defineModel<FormRow[]>({ required: true })

const store = useAdminCatalogStore()

type TargetKind = ChangeRow['kind']

const whoGroups: OptionGroup[] = [
	{
		options: [
			{ value: 'self', label: 'Владелец' },
			{ value: 'chosen', label: 'Цель' },
		],
	},
]

const actionGroups: OptionGroup[] = [
	{
		options: [
			{ value: 'get', label: 'Получает' },
			{ value: 'lose', label: 'Теряет' },
		],
	},
]

const resourceOption = (kind: TargetKind, target: CatalogOption) => ({
	value: `${kind}:${target.id}`,
	label: target.name,
	meta: { perk: 'перк', effect: 'эффект' }[kind as string],
})

const resourceGroups = computed<OptionGroup[]>(() => {
	const t = store.targets

	if (variant === 'modifier') {
		return [{ options: t.points.map((o) => resourceOption('points', o)) }]
	}

	return [
		{
			title: 'Очки',
			options: t.points.map((o) => resourceOption('points', o)),
		},
		{
			title: 'Предметы',
			options: [
				...t.item.map((o) => resourceOption('item', o)),
				...(variant === 'item-entry'
					? [
							{
								value: 'user-item',
								label: 'Предмет на выбор',
								hint: 'Игрок укажет сам, когда применит',
							},
						]
					: []),
			],
		},
		{
			title: 'Перки и эффекты',
			options: [
				...t.perk.map((o) => resourceOption('perk', o)),
				...t.effect.map((o) => resourceOption('effect', o)),
			],
		},
	]
})

/** the sign of the amount is the action, so a cost has none */
const hasAction = computed(() => variant !== 'cost')

const isLose = (row: FormRow) => /^[-−]/.test(row.amount.trim())

const absolute = (row: FormRow) => row.amount.trim().replace(/^[-−]/, '')

const resourceOf = (row: FormRow) =>
	row.kind === 'user-item'
		? 'user-item'
		: row.targetId
			? `${row.kind}:${row.targetId}`
			: ''

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

const setResource = (row: FormRow, value: string) => {
	if (value === 'user-item') {
		row.kind = 'user-item'
		row.targetId = ''
	} else {
		const [kind, id] = value.split(':')

		row.kind = kind
		row.targetId = id

		// a perk or an effect is held once; a taken one keeps its minus
		if (kind === 'perk' || kind === 'effect') {
			row.amount = isLose(row) ? '-1' : '1'
		}
	}
}

const setAction = (row: FormRow, action: string) => {
	row.amount = (action === 'lose' ? '-' : '') + absolute(row)
}

/** a typed sign is dropped: the sign belongs to the action */
const setAmount = (row: FormRow, event: Event) => {
	const input = event.target as HTMLInputElement
	const digits = input.value.replace(/^[-−+\s]+/, '')

	input.value = digits
	row.amount = (hasAction.value && isLose(row) ? '-' : '') + digits
}

onMounted(() => store.loadTargets())
</script>

<template>
	<UiFormSection
		:title="label"
		:empty
		:is-empty="!rows.length"
		:add-label
		:hint
		@add="addRow"
	>
		<div v-if="rows.length" class="rows" :class="`rows--${variant}`">
			<span v-if="variant === 'item-entry'" class="rows__sub">Кто</span>
			<span v-if="hasAction" class="rows__sub">Действие</span>
			<span class="rows__sub">Кол-во</span>
			<span class="rows__sub">{{
				variant === 'modifier' ? 'Очки' : 'Ресурс'
			}}</span>
			<span></span>

			<template v-for="(row, i) in rows" :key="i">
				<UiPicker
					v-if="variant === 'item-entry'"
					compact
					:groups="whoGroups"
					:model-value="row.who"
					aria-label="Кто"
					@update:model-value="row.who = $event as FormRow['who']"
				/>
				<UiPicker
					v-if="hasAction"
					compact
					:groups="actionGroups"
					:tone="isLose(row) ? 'lose' : 'get'"
					:model-value="isLose(row) ? 'lose' : 'get'"
					aria-label="Действие"
					@update:model-value="setAction(row, $event)"
				/>
				<input
					class="rows__amount"
					inputmode="numeric"
					:value="hasAction ? absolute(row) : row.amount"
					aria-label="Количество"
					@input="setAmount(row, $event)"
				/>
				<UiPicker
					compact
					search
					:panel-width="260"
					:groups="resourceGroups"
					:model-value="resourceOf(row)"
					placeholder="Выбери ресурс"
					aria-label="Ресурс"
					@update:model-value="setResource(row, $event)"
				/>
				<UiIconButton
					type="button"
					icon="x"
					size="sm"
					label="Убрать"
					@click="rows.splice(i, 1)"
				/>
			</template>
		</div>
	</UiFormSection>
</template>

<style scoped>
.rows {
	display: grid;
	align-items: center;
	gap: 8px;
}

.rows--item-entry {
	grid-template-columns: 124px 124px 56px minmax(0, 1fr) 32px;
}

.rows--change,
.rows--modifier {
	grid-template-columns: 140px 64px minmax(0, 1fr) 32px;
}

.rows--cost {
	grid-template-columns: 60px minmax(0, 1fr) 32px;
}

.rows__sub {
	font: 600 13px / 1 var(--font-body);
	color: var(--text-muted);
	white-space: nowrap;
}

.rows__amount {
	width: 100%;
	height: 36px;
	padding: 0 10px;
	font: 500 14px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
	background: var(--surface-card);
	border: var(--border-width) solid var(--border-default);
	border-radius: var(--radius-sm);
	outline: 0;
}

.rows__amount:focus {
	border-color: var(--border-strong);
	box-shadow: var(--shadow-focus);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogOption, ChangeRow } from '../api-facade/contracts'
import { useAdminCatalogStore } from '../stores/adminCatalogStore'
import type { FormProblem, FormRow, RowsVariant } from './formDialog'
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
	/** what is wrong: the cell it names turns red, or the title when it names none */
	problem?: FormProblem
}

const { variant, addLabel = 'Строка', problem } = defineProps<Props>()

const isWrong = (i: number, cell: FormProblem['cell']) =>
	problem?.row === i && problem.cell === cell

const rows = defineModel<FormRow[]>({ required: true })

const store = useAdminCatalogStore()

type TargetKind = ChangeRow['kind']

const whoGroups: OptionGroup[] = [
	{
		options: [
			{ value: 'self', label: 'Владелец' },
			{ value: 'chosen', label: 'Выбранный игрок' },
		],
	},
]

/** in a transfer `who` is the side that gives the copies away */
const transferWhoGroups: OptionGroup[] = [
	{
		options: [
			{ value: 'self', label: 'Владелец → выбранному' },
			{ value: 'chosen', label: 'Выбранный → владельцу' },
		],
	},
]

type Action = 'get' | 'lose' | 'copy' | 'delete' | 'give'

const catalogActions: OptionGroup = {
	options: [
		{ value: 'get', label: 'Получает' },
		{ value: 'lose', label: 'Теряет' },
	],
}

/** the copies these act on are picked by the player when the item is used */
const pickedActions: OptionGroup = {
	title: 'Предмет, выбранный игроком',
	options: [
		{ value: 'copy', label: 'Копирует' },
		{ value: 'delete', label: 'Удаляет' },
		{ value: 'give', label: 'Передаёт' },
	],
}

const actionGroups = computed(() =>
	variant === 'item-entry' ? [catalogActions, pickedActions] : [catalogActions],
)

const isGrantOnly = (row: FormRow) =>
	variant === 'effect-end' && row.kind === 'item'

const isTransfer = (row: FormRow) => row.kind === 'user-item-transfer'

const isPicked = (row: FormRow) => row.kind === 'user-item' || isTransfer(row)

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
			options: t.item.map((o) => resourceOption('item', o)),
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

const actionOf = (row: FormRow): Action => {
	if (isTransfer(row)) return 'give'
	if (row.kind === 'user-item') return isLose(row) ? 'delete' : 'copy'

	return isLose(row) ? 'lose' : 'get'
}

const toneOf = (row: FormRow) =>
	isPicked(row) ? undefined : isLose(row) ? 'lose' : 'get'

const resourceOf = (row: FormRow) =>
	row.targetId ? `${row.kind}:${row.targetId}` : ''

const firstTarget = (kind: string) => store.targets[kind as TargetKind]?.[0]?.id

const addRow = () => {
	const kind = variant === 'cost' ? 'item' : 'points'

	rows.value.push({
		kind,
		targetId: String(firstTarget(kind) ?? ''),
		amount: '1',
		who: 'self',
	})
}

const setResource = (row: FormRow, value: string) => {
	const [kind, id] = value.split(':')

	row.kind = kind
	row.targetId = id
	if (isGrantOnly(row)) row.amount = absolute(row)

	// a perk or an effect is held once; a taken one keeps its minus
	if (kind === 'perk' || kind === 'effect') {
		row.amount = isLose(row) ? '-1' : '1'
	}
}

const setAction = (row: FormRow, action: Action) => {
	const amount = absolute(row)

	switch (action) {
		case 'copy':
		case 'delete':
		case 'give':
			row.kind = action === 'give' ? 'user-item-transfer' : 'user-item'
			row.targetId = ''
			row.amount = (action === 'delete' ? '-' : '') + amount
			return
	}

	// back from a picked copy the row needs a catalogue resource again
	if (isPicked(row)) {
		row.kind = 'points'
		row.targetId = String(firstTarget('points') ?? '')
	}

	row.amount = (action === 'lose' ? '-' : '') + amount
}

/** a typed sign is dropped: the sign belongs to the action */
const setAmount = (row: FormRow, event: Event) => {
	const input = event.target as HTMLInputElement
	const digits = input.value.replace(/^[-−+\s]+/, '')

	input.value = digits
	row.amount = (hasAction.value && isLose(row) ? '-' : '') + digits
}
</script>

<template>
	<UiFormSection
		:title="label"
		:empty
		:is-empty="!rows.length"
		:add-label
		:hint
		:invalid="!!problem && problem.row === undefined"
		@add="addRow"
	>
		<template v-if="$slots.aside" #aside>
			<slot name="aside" />
		</template>
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
					:groups="isTransfer(row) ? transferWhoGroups : whoGroups"
					:model-value="row.who"
					aria-label="Кто"
					@update:model-value="row.who = $event as FormRow['who']"
				/>
				<UiPicker
					v-if="hasAction"
					compact
					:groups="
						isGrantOnly(row)
							? [{ options: [catalogActions.options[0]] }]
							: actionGroups
					"
					:tone="toneOf(row)"
					:model-value="actionOf(row)"
					aria-label="Действие"
					@update:model-value="setAction(row, $event as Action)"
				/>
				<input
					class="rows__amount"
					:class="{ 'rows__amount--invalid': isWrong(i, 'amount') }"
					inputmode="numeric"
					:value="hasAction ? absolute(row) : row.amount"
					aria-label="Количество"
					@input="setAmount(row, $event)"
				/>
				<span v-if="isPicked(row)" class="rows__picked">Выбирает игрок</span>
				<UiPicker
					v-else
					compact
					search
					:panel-width="260"
					:groups="resourceGroups"
					:model-value="resourceOf(row)"
					:invalid="isWrong(i, 'target')"
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
	grid-template-columns: 192px 118px 52px minmax(0, 1fr) 32px;
}

.rows--change,
.rows--effect-end,
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

.rows__picked {
	min-width: 0;
	height: 36px;
	padding: 0 10px;
	overflow: hidden;
	font: 500 14px / 36px var(--font-body);
	color: var(--text-muted);
	white-space: nowrap;
	text-overflow: ellipsis;
	background: var(--surface-sunken);
	border-radius: var(--radius-sm);
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

.rows__amount--invalid,
.rows__amount--invalid:focus {
	border-color: var(--danger);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type {
	HistoryEventKind,
	PerkTriggerAction,
} from '../api-facade/contracts'
import { useAdminCatalogStore } from '../stores/adminCatalogStore'
import {
	gameEndStateLabels,
	triggerActionLabels,
	triggerEventGroups,
	triggerFilterOf,
} from '../utils/perkTrigger'
import type { TriggerFormRow } from './formDialog'
import UiFormSection from './ui/UiFormSection.vue'
import UiIconButton from './ui/UiIconButton.vue'
import type { OptionGroup } from './ui/UiOptionList.vue'
import UiPicker from './ui/UiPicker.vue'

type Props = {
	label: string
	/** the text of the "+" link */
	addLabel?: string
	/** the triggers break a rule of the form: the title turns red */
	invalid?: boolean
}

const { addLabel = 'Строка' } = defineProps<Props>()

const rows = defineModel<TriggerFormRow[]>({ required: true })

const store = useAdminCatalogStore()

/** the picker keeps a value for «any», the row keeps it empty */
const ANY = 'any'

const actionGroups: OptionGroup[] = [
	{
		options: (Object.keys(triggerActionLabels) as PerkTriggerAction[]).map(
			(value) => ({ value, label: triggerActionLabels[value] }),
		),
	},
]

const pointTypeGroups = computed<OptionGroup[]>(() => [
	{ options: [{ value: ANY, label: 'Любые очки' }] },
	{
		options: store.targets.points.map(({ id, name }) => ({
			value: String(id),
			label: name,
		})),
	},
])

const exchangeGroups = computed<OptionGroup[]>(() => [
	{ options: [{ value: ANY, label: 'Любой обмен' }] },
	{
		options: store.exchangeOptions.map(({ id, name }) => ({
			value: String(id),
			label: name,
		})),
	},
])

const endStateGroups: OptionGroup[] = [
	{ options: [{ value: ANY, label: 'Любой исход' }] },
	{
		options: Object.entries(gameEndStateLabels).map(([value, label]) => ({
			value,
			label,
		})),
	},
]

/** the options of the narrowing of an event that has one */
const filterGroups = (eventKind: HistoryEventKind): OptionGroup[] => {
	switch (triggerFilterOf(eventKind)) {
		case 'point-type':
			return pointTypeGroups.value
		case 'exchange':
			return exchangeGroups.value
		default:
			return endStateGroups
	}
}

const addRow = () => {
	rows.value.push({
		action: 'add_charge',
		eventKind: 'game_ended',
		filter: '',
	})
}

const setEvent = (row: TriggerFormRow, eventKind: string) => {
	row.eventKind = eventKind
	// a narrowing belongs to its event
	row.filter = ''
}
</script>

<template>
	<UiFormSection :title="label" :add-label :invalid @add="addRow">
		<div v-if="rows.length" class="triggers">
			<span class="triggers__sub">Действие</span>
			<span class="triggers__sub">Событие</span>
			<span class="triggers__sub">Уточнение</span>
			<span></span>

			<template v-for="(row, i) in rows" :key="i">
				<UiPicker
					compact
					:groups="actionGroups"
					:model-value="row.action"
					aria-label="Действие"
					@update:model-value="row.action = $event as PerkTriggerAction"
				/>
				<UiPicker
					compact
					:panel-width="240"
					:groups="triggerEventGroups"
					:model-value="row.eventKind"
					aria-label="Событие"
					@update:model-value="setEvent(row, $event)"
				/>
				<UiPicker
					v-if="triggerFilterOf(row.eventKind)"
					compact
					:search="triggerFilterOf(row.eventKind) !== 'end-state'"
					:panel-width="240"
					:groups="filterGroups(row.eventKind)"
					:model-value="row.filter || ANY"
					aria-label="Уточнение"
					@update:model-value="row.filter = $event === ANY ? '' : $event"
				/>
				<span v-else></span>
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
.triggers {
	display: grid;
	grid-template-columns: 172px minmax(0, 1.25fr) minmax(0, 1fr) 32px;
	align-items: center;
	gap: 8px;
}

.triggers__sub {
	font: 600 13px / 1 var(--font-body);
	color: var(--text-muted);
	white-space: nowrap;
}
</style>

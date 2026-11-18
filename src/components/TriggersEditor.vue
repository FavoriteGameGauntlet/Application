<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { PerkTriggerAction } from '../api-facade/contracts'
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

const endStateGroups: OptionGroup[] = [
	{ options: [{ value: ANY, label: 'Любой исход' }] },
	{
		options: Object.entries(gameEndStateLabels).map(([value, label]) => ({
			value,
			label,
		})),
	},
]

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

onMounted(() => store.loadTargets())
</script>

<template>
	<UiFormSection :title="label" :add-label @add="addRow">
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
					:search="triggerFilterOf(row.eventKind) === 'point-type'"
					:panel-width="240"
					:groups="
						triggerFilterOf(row.eventKind) === 'point-type'
							? pointTypeGroups
							: endStateGroups
					"
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

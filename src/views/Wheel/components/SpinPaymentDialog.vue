<script setup lang="ts">
import { computed } from 'vue'
import FormDialog from '../../../components/FormDialog.vue'
import type { FormSection, FormValues } from '../../../components/formDialog'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { formatCost } from '../../../utils/formatResource'
import { needsChoice, type PaymentChoice } from '../../../utils/spinPayment'

type Props = {
	/** set while the dialog is open */
	choices: PaymentChoice[] | null
}

const { choices } = defineProps<Props>()

const emit = defineEmits<{
	close: []
	confirm: [picked: Record<number, number[]>]
}>()

const resourcesStore = useResourcesStore()

const nounOf = { item: 'предмет', perk: 'перк', effect: 'эффект' } as const

const rows = computed(() =>
	(choices ?? []).map((choice, index) => ({
		choice,
		index,
		choose: needsChoice(choice),
	})),
)

const costText = (choice: PaymentChoice) =>
	formatCost(choice.cost, resourcesStore.pointTypes)

const subtitle = computed(() => {
	const fixed = rows.value
		.filter((r) => !r.choose)
		.map((r) => costText(r.choice))
		.join(', ')
	const all = rows.value.map((r) => costText(r.choice)).join(', ')

	return fixed
		? `Прокрут стоит ${all}. Спишется само: ${fixed}.`
		: `Прокрут стоит ${all}.`
})

/** the rows with copies to choose from; the rest is taken whole */
const sections = computed<FormSection[]>(() =>
	rows.value
		.filter((r) => r.choose)
		.map((r) => ({
			title: `Отдать: ${costText(r.choice)}`,
			fields: [
				{
					key: `row-${r.index}`,
					label: costText(r.choice),
					type: 'pick',
					limit: r.choice.cost.amount,
					required:
						r.choice.cost.kind === 'points'
							? 'выбор'
							: nounOf[r.choice.cost.kind],
					options: r.choice.options.map((o) => ({
						value: String(o.id),
						label: o.label,
						meta: o.meta,
					})),
				},
			],
		})),
)

const onSave = (values: FormValues) => {
	const picked: Record<number, number[]> = {}

	rows.value
		.filter((r) => r.choose)
		.forEach((r) => {
			picked[r.index] = (values[`row-${r.index}`] as string[]).map(Number)
		})

	emit('confirm', picked)
}
</script>

<template>
	<FormDialog
		:open="!!choices"
		title="Чем заплатить"
		:subtitle
		:sections
		:initial="{}"
		submit-label="Заплатить"
		:width="480"
		@close="emit('close')"
		@save="onSave"
	/>
</template>

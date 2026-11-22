<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WheelCatalogGroup } from '../../../api-facade/contracts'
import FormDialog from '../../../components/FormDialog.vue'
import type {
	FormField,
	FormRow,
	FormValues,
} from '../../../components/formDialog'
import UiButton from '../../../components/ui/UiButton.vue'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'
import {
	changeRowsToForm,
	parseCostRows,
	parsedRows,
	problemOf,
} from '../../../utils/formRows'

const { group } = defineProps<{ group: WheelCatalogGroup }>()

const store = useAdminWheelStore()

const isEditing = ref(false)

const fields: FormField[] = [
	{
		key: 'cost',
		label: 'Игрок платит за прокрут',
		type: 'rows',
		variant: 'cost',
		addLabel: 'Ресурс',
		empty: 'Строк нет: прокрут бесплатный.',
		check: (values) => problemOf(parseCostRows(values.cost as FormRow[])),
	},
]

const initial = computed<FormValues>(() => ({
	cost: changeRowsToForm(
		group.cost.map((row) => ({
			kind: row.kind,
			targetId: row.id,
			amount: row.amount,
		})),
	),
}))

const onSave = async (values: FormValues) => {
	const cost = parsedRows(parseCostRows(values.cost as FormRow[]))

	if (await store.saveSpinCost(group, cost)) isEditing.value = false
}
</script>

<template>
	<UiButton variant="outline" size="sm" @click="isEditing = true">
		Изменить цену
	</UiButton>

	<FormDialog
		:open="isEditing"
		title="Цена прокрута"
		:subtitle="`Группа «${group.name}»`"
		submit-label="Сохранить"
		:sections="[{ fields }]"
		:initial
		@close="isEditing = false"
		@save="onSave"
	/>
</template>

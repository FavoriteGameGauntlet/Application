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
import { useToastStore } from '../../../stores/toastStore'
import { changeRowsToForm, parseCostRows } from '../../../utils/formRows'

const { group } = defineProps<{ group: WheelCatalogGroup }>()

const store = useAdminWheelStore()
const toastStore = useToastStore()

const isEditing = ref(false)

const fields: FormField[] = [
	{
		key: 'cost',
		label: 'Игрок платит за прокрут',
		type: 'rows',
		variant: 'cost',
		addLabel: 'Ресурс',
		empty: 'Строк нет: прокрут бесплатный.',
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
	const parsed = parseCostRows(values.cost as FormRow[])

	if ('error' in parsed) {
		toastStore.show('Проверь цену', parsed.error, 'danger')
		return
	}

	if (await store.saveSpinCost(group, parsed.value)) isEditing.value = false
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

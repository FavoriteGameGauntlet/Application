<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type {
	AdminWheelGroup,
	SpinCostRow,
} from '../../../api-facade/contracts'
import FormDialog from '../../../components/FormDialog.vue'
import type {
	FormField,
	FormRow,
	FormValues,
} from '../../../components/formDialog'
import UiButton from '../../../components/ui/UiButton.vue'
import { useAdminCatalogStore } from '../../../stores/adminCatalogStore'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useToastStore } from '../../../stores/toastStore'
import { formatCost } from '../../../utils/formatResource'
import { changeRowsToForm, parseCostRows } from '../../../utils/formRows'

const { group } = defineProps<{ group: AdminWheelGroup }>()

const catalogStore = useAdminCatalogStore()
const resourcesStore = useResourcesStore()
const store = useAdminWheelStore()
const toastStore = useToastStore()

const cost = ref<SpinCostRow[]>([])
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
	cost: changeRowsToForm(cost.value),
}))

const pills = computed(() =>
	cost.value.map((row) =>
		formatCost(
			{
				kind: row.kind,
				id: row.targetId,
				name:
					catalogStore.targets[row.kind].find((t) => t.id === row.targetId)
						?.name ?? '…',
				amount: row.amount,
			},
			resourcesStore.pointTypes,
		),
	),
)

const onSave = async (values: FormValues) => {
	const parsed = parseCostRows(values.cost as FormRow[])

	if ('error' in parsed) {
		toastStore.show('Проверь цену', parsed.error, 'danger')
		return
	}

	if (await store.saveSpinCost(group, parsed.value)) {
		cost.value = parsed.value
		isEditing.value = false
	}
}

onMounted(async () => {
	try {
		const [loaded] = await Promise.all([
			store.loadSpinCost(group),
			catalogStore.loadTargets(),
		])

		cost.value = loaded
	} catch (e) {
		toastStore.error(e)
	}
})
</script>

<template>
	<div class="cost">
		<span class="cost__label">Прокрут стоит</span>
		<span v-for="(pill, i) in pills" :key="i" class="cost__pill">{{
			pill
		}}</span>
		<span v-if="!pills.length" class="cost__free">бесплатно</span>
		<span class="cost__note">Платит игрок, когда применяет результат.</span>
		<div class="cost__spacer"></div>
		<UiButton variant="outline" size="sm" @click="isEditing = true">
			Изменить цену
		</UiButton>
	</div>

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

<style scoped>
.cost {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 12px;
	padding-top: 14px;
	border-top: 1px solid var(--border-subtle);
}

.cost__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.cost__pill {
	display: inline-flex;
	align-items: center;
	height: 26px;
	padding: 0 10px;
	font: 500 12px / 1 var(--font-body);
	color: var(--text-body);
	white-space: nowrap;
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
}

.cost__free {
	font: var(--type-body-sm);
	color: var(--text-body);
}

.cost__note {
	font: var(--type-caption);
	color: var(--text-muted);
}

.cost__spacer {
	flex: 1;
}
</style>

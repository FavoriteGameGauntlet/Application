<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiCheckbox from '../../../components/ui/UiCheckbox.vue'
import UiDialog from '../../../components/ui/UiDialog.vue'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { formatCost } from '../../../utils/formatResource'
import { needsChoice, type PaymentChoice } from '../../../utils/spinPayment'

type Props = {
	/** set while the dialog is open */
	choices: PaymentChoice[] | null
}

const { choices } = defineProps<Props>()

const emit = defineEmits<{ close: []; confirm: [picked: Record<number, number[]>] }>()

const resourcesStore = useResourcesStore()

/** the ids picked for the rows that need a choice, by the index of the row */
const picked = reactive<Record<number, number[]>>({})

const rows = computed(() =>
	(choices ?? []).map((choice, index) => ({ choice, index, choose: needsChoice(choice) })),
)

const chosenRows = computed(() => rows.value.filter((r) => r.choose))

const fixedText = computed(() =>
	rows.value
		.filter((r) => !r.choose)
		.map((r) => formatCost(r.choice.cost, resourcesStore.pointTypes))
		.join(', '),
)

const isFull = (index: number, amount: number) => (picked[index]?.length ?? 0) >= amount

const canConfirm = computed(() =>
	chosenRows.value.every((r) => picked[r.index]?.length === r.choice.cost.amount),
)

const toggle = (index: number, id: number, on: boolean) => {
	const ids = picked[index] ?? []

	picked[index] = on ? [...ids, id] : ids.filter((x) => x !== id)
}

watch(
	() => choices,
	() => {
		Object.keys(picked).forEach((key) => delete picked[Number(key)])
	},
)
</script>

<template>
	<UiDialog :open="!!choices" title="Чем заплатить за прокрут" :width="460" @close="emit('close')">
		<div class="dialog">
			<div v-for="row in chosenRows" :key="row.index" class="dialog__block">
				<span class="label">
					{{ formatCost(row.choice.cost, resourcesStore.pointTypes) }} · выбери
					{{ row.choice.cost.amount }}
				</span>

				<UiCheckbox
					v-for="option in row.choice.options"
					:key="option.id"
					:label="option.label"
					:model-value="picked[row.index]?.includes(option.id) ?? false"
					:disabled="
						!picked[row.index]?.includes(option.id) && isFull(row.index, row.choice.cost.amount)
					"
					@update:model-value="toggle(row.index, option.id, $event)"
				/>
			</div>

			<span v-if="fixedText" class="dialog__fixed">Также спишется: {{ fixedText }}</span>

			<div class="dialog__actions">
				<UiButton variant="outline" @click="emit('close')">Отмена</UiButton>
				<UiButton icon="check" :disabled="!canConfirm" @click="emit('confirm', { ...picked })">
					Применить
				</UiButton>
			</div>
		</div>
	</UiDialog>
</template>

<style scoped>
.dialog {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.dialog__block {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.dialog__fixed {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.dialog__actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}
</style>

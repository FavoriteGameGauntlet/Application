<script setup lang="ts">
import { ref, watch } from 'vue'
import { SPAN_STEPS, splitSpan } from '../../utils/format'
import UiIconButton from './UiIconButton.vue'
import UiInput from './UiInput.vue'
import UiPicker from './UiPicker.vue'

type Props = {
	label?: string
}

defineProps<Props>()

/** the length in seconds as a string; empty is no length */
const model = defineModel<string>({ default: '' })

const groups = [
	{
		options: SPAN_STEPS.map((s) => ({
			value: String(s.seconds),
			label: s.label,
		})),
	},
]

const amount = ref('')
const unit = ref(String(SPAN_STEPS[0].seconds))
/** what this component wrote itself: it must not be split into units again */
let written = model.value

const read = (seconds: string) => {
	if (seconds === '') {
		amount.value = ''

		return
	}

	const parts = splitSpan(Number(seconds))

	amount.value = String(parts.amount)
	unit.value = String(parts.unit)
}

watch(
	model,
	(seconds) => {
		if (seconds !== written) read(seconds)
	},
	{ immediate: true },
)

const write = () => {
	const count = Number(amount.value)
	const seconds =
		amount.value.trim() === '' || Number.isNaN(count)
			? amount.value.trim()
			: String(count * Number(unit.value))

	written = seconds
	model.value = seconds
}

watch([amount, unit], write)

const clear = () => {
	amount.value = ''
}
</script>

<template>
	<div class="ui-span-input" role="group" :aria-label="label">
		<UiInput v-model="amount" numeric aria-label="Интервал" />
		<UiPicker v-model="unit" :groups aria-label="Единица времени" />
		<UiIconButton
			type="button"
			icon="x"
			size="sm"
			style="--ui-icon-button-d: 28px"
			label="Убрать"
			@click="clear"
		/>
	</div>
</template>

<style scoped>
.ui-span-input {
	display: grid;
	grid-template-columns: 64px minmax(0, 1fr) 28px;
	align-items: center;
	gap: 8px;
}
</style>

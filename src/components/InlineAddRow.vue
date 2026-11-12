<script setup lang="ts">
import { useTemplateRef } from 'vue'
import UiButton from './ui/UiButton.vue'
import UiInput from './ui/UiInput.vue'

type Props = {
	placeholder: string
	/** the name of the field for a screen reader, the field has no visible label */
	label: string
	error?: string
}

defineProps<Props>()

const emit = defineEmits<{ submit: [value: string] }>()

/** the parent owns the text: it clears it after a success and keeps it after a failure */
const model = defineModel<string>({ default: '' })

const root = useTemplateRef('root')

const submit = () => {
	const value = model.value.trim()

	if (!value) return

	emit('submit', value)

	// a click on the button takes the focus; the next entry is typed at once
	root.value?.querySelector('input')?.focus()
}
</script>

<template>
	<div ref="root" class="add-row">
		<div class="add-row__input">
			<UiInput
				v-model="model"
				compact
				icon="plus"
				:placeholder
				:aria-label="label"
				:aria-invalid="!!error"
				:error
				@keydown.enter.prevent="submit"
			/>
		</div>
		<UiButton variant="outline" :disabled="!model.trim()" @click="submit">
			Добавить
		</UiButton>
	</div>
</template>

<style scoped>
.add-row {
	display: flex;
	gap: 8px;
	align-items: flex-start;
}

.add-row__input {
	flex: 1;
	min-width: 0;
}
</style>

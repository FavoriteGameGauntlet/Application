<script setup lang="ts">
import UiButton from './ui/UiButton.vue'
import UiDialog from './ui/UiDialog.vue'

type Props = {
	open: boolean
	title: string
	text: string
	okLabel?: string
}

const { okLabel = 'Удалить' } = defineProps<Props>()

const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
	<UiDialog :open :title :width="420" @close="emit('close')">
		<span class="confirm__text">{{ text }}</span>

		<template #footer>
			<UiButton variant="ghost" @click="emit('close')">Отмена</UiButton>
			<UiButton variant="danger" @click="emit('confirm')">
				{{ okLabel }}
			</UiButton>
		</template>
	</UiDialog>
</template>

<style scoped>
.confirm__text {
	text-wrap: pretty;
}
</style>

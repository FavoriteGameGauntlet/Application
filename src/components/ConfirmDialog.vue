<script setup lang="ts">
import UiButton from './ui/UiButton.vue'
import UiDialog from './ui/UiDialog.vue'

type Props = {
	open: boolean
	title: string
	text: string
	okLabel?: string
	cancelLabel?: string
}

const { okLabel = 'Удалить', cancelLabel = 'Отмена' } = defineProps<Props>()

const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
	<UiDialog :open :title :width="440" @close="emit('close')">
		<span class="confirm__text">{{ text }}</span>

		<template #footer>
			<UiButton variant="ghost" @click="emit('close')">{{
				cancelLabel
			}}</UiButton>
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

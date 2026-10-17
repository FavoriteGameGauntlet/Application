<script setup lang="ts">
import UiButton from '../../../components/ui/UiButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiPageTitle from '../../../components/ui/UiPageTitle.vue'
import UiSwitch from '../../../components/ui/UiSwitch.vue'

type Props = {
	title: string
}

defineProps<Props>()

const showDeleted = defineModel<boolean>('showDeleted', { required: true })
const query = defineModel<string>('query', { default: '' })

const emit = defineEmits<{ add: [] }>()
</script>

<template>
	<div class="head">
		<UiPageTitle>{{ title }}</UiPageTitle>
		<div class="head__spacer"></div>
		<div class="head__search">
			<UiInput v-model="query" compact icon="search" placeholder="Найти…" aria-label="Поиск" />
		</div>
		<UiSwitch v-model="showDeleted" label="Показать удалённые" />
		<UiButton icon="plus" @click="emit('add')">Добавить</UiButton>
	</div>
</template>

<style scoped>
.head {
	display: flex;
	align-items: center;
	gap: 20px;
}

.head__spacer {
	flex: 1;
}

.head__search {
	width: 260px;
}
</style>

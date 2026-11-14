<script setup lang="ts">
import UiButton from '../../../components/ui/UiButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiPageTitle from '../../../components/ui/UiPageTitle.vue'
import UiSwitch from '../../../components/ui/UiSwitch.vue'

type Props = {
	title: string
	/** the number of shown rows with its noun, «4 обмена» */
	count: string
	placeholder?: string
}

const { placeholder = 'Найти…' } = defineProps<Props>()

const showDeleted = defineModel<boolean>('showDeleted', { required: true })
const query = defineModel<string>('query', { default: '' })

const emit = defineEmits<{ add: [] }>()
</script>

<template>
	<div class="head">
		<UiPageTitle>{{ title }}</UiPageTitle>
		<span class="head__count">{{ count }}</span>
		<div class="head__spacer"></div>
		<UiButton icon="plus" @click="emit('add')">Добавить</UiButton>
	</div>

	<div class="bar">
		<div class="bar__search">
			<UiInput
				v-model="query"
				compact
				icon="search"
				:placeholder
				aria-label="Поиск"
			/>
		</div>
		<UiSwitch v-model="showDeleted" label="Показать удалённые" />
	</div>
</template>

<style scoped>
.head,
.bar {
	display: flex;
	align-items: center;
	gap: 12px;
}

.bar {
	gap: 24px;
}

.head__count {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.head__spacer {
	flex: 1;
}

.bar__search {
	width: 260px;
}
</style>

<script setup lang="ts">
import UiButton from '../../../components/ui/UiButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiPageTitle from '../../../components/ui/UiPageTitle.vue'

type Props = {
	title: string
	placeholder?: string
	/** a list whose entries are not added by the admin has no «Добавить» */
	noAdd?: boolean
}

const { placeholder = 'Найти…', noAdd } = defineProps<Props>()

const query = defineModel<string>('query', { default: '' })

const emit = defineEmits<{ add: [] }>()
</script>

<template>
	<div class="head">
		<UiPageTitle>{{ title }}</UiPageTitle>
		<div class="head__spacer"></div>
		<UiButton v-if="!noAdd" icon="plus" @click="emit('add')">Добавить</UiButton>
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
		<!-- the screen's own filters -->
		<slot />
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

.head__spacer {
	flex: 1;
}

.bar__search {
	width: 260px;
}
</style>

<script setup lang="ts">
import UiInput from './ui/UiInput.vue'

type Props = {
	placeholder?: string
}

const { placeholder = 'Найти…' } = defineProps<Props>()

const query = defineModel<string>('query', { default: '' })
</script>

<template>
	<div class="list-bar">
		<div class="list-bar__search">
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
.list-bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 24px;
}

.list-bar__search {
	width: 260px;
}
</style>

<script setup lang="ts">
import UiButton from './ui/UiButton.vue'
import UiCountBadge from './ui/UiCountBadge.vue'
import UiPageTitle from './ui/UiPageTitle.vue'

type Props = {
	title: string
	/** how many entries there are, shown as a chip after the title; a screen whose filters show the counts leaves it out */
	count?: number
	/** a list whose entries are not added on this screen has no «Добавить» */
	noAdd?: boolean
}

const { noAdd } = defineProps<Props>()

const emit = defineEmits<{ add: [] }>()
</script>

<template>
	<div class="list-head">
		<UiPageTitle>{{ title }}</UiPageTitle>
		<UiCountBadge v-if="count !== undefined" :value="count" />
		<div class="list-head__spacer"></div>
		<UiButton v-if="!noAdd" icon="plus" @click="emit('add')">Добавить</UiButton>
	</div>
</template>

<style scoped>
.list-head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.list-head__spacer {
	flex: 1;
}
</style>

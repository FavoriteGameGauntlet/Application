<script setup lang="ts">
import type { CatalogEntry } from '../../../api-facade/contracts'
import CatalogEntryCard from '../../../components/CatalogEntryCard.vue'
import type { CatalogView } from '../../../components/catalogTable'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'

type Props = {
	view: CatalogView
	entry: CatalogEntry
}

const { view, entry } = defineProps<Props>()

const emit = defineEmits<{
	close: []
	edit: []
	remove: []
	restore: []
}>()
</script>

<template>
	<aside class="drawer" aria-label="Карточка записи">
		<div class="drawer__bar">
			<template v-if="!entry.deleted">
				<UiButton
					variant="outline"
					size="sm"
					icon="pencil"
					@click="emit('edit')"
					>Изменить</UiButton
				>
				<UiIconButton
					icon="trash-2"
					size="sm"
					label="Удалить"
					@click="emit('remove')"
				/>
			</template>
			<UiButton
				v-else
				variant="outline"
				size="sm"
				icon="rotate-ccw"
				@click="emit('restore')"
				>Вернуть</UiButton
			>
			<div class="drawer__spacer"></div>
			<UiIconButton icon="x" size="sm" label="Закрыть" @click="emit('close')" />
		</div>

		<div class="drawer__body">
			<CatalogEntryCard :key="entry.id" :view :entry />
		</div>
	</aside>
</template>

<style scoped>
/* above the page, under the dialogs (100) that its buttons open */
.drawer {
	position: fixed;
	top: var(--topbar-h);
	right: 0;
	bottom: 0;
	z-index: 5;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	width: 460px;
	background: var(--surface-card);
	border-left: 1px solid var(--border-subtle);
	box-shadow: var(--shadow-3);
}

.drawer__bar {
	display: flex;
	flex: none;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid var(--border-subtle);
}

.drawer__spacer {
	flex: 1;
}

.drawer__body {
	flex: 1;
	min-height: 0;
	overflow: auto;
}
</style>

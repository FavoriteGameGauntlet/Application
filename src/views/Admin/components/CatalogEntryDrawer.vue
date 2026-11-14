<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogEntry } from '../../../api-facade/contracts'
import CatalogEntryCard from '../../../components/CatalogEntryCard.vue'
import {
	type CatalogView,
	catalogHolders,
} from '../../../components/catalogTable'
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

const holdersLabel = computed(() => catalogHolders[view])
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

		<div class="drawer__admin">
			<span class="drawer__label">Для админа</span>
			<div class="drawer__stats">
				<div v-if="holdersLabel" class="stat">
					<span class="stat__label">{{ holdersLabel }}</span>
					<span class="stat__num">{{
						(entry.holdersTotal ?? 0).toLocaleString('ru-RU')
					}}</span>
				</div>
				<div class="stat">
					<span class="stat__label">Статус</span>
					<span class="stat__text">{{
						entry.deleted ? 'Удалён' : 'Активен'
					}}</span>
				</div>
			</div>
			<span v-if="entry.deleted" class="drawer__note">
				Удалённая запись скрыта от игроков, история осталась.
			</span>
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

.drawer__admin {
	display: flex;
	flex: none;
	flex-direction: column;
	gap: 10px;
	padding: 16px 24px 20px;
	background: var(--surface-sunken);
	border-top: 1px solid var(--border-subtle);
}

.drawer__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.drawer__stats {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

.stat {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	padding: 12px 14px;
	background: var(--surface-card);
	border-radius: var(--radius-md);
}

.stat__label,
.drawer__note {
	font: var(--type-caption);
	color: var(--text-muted);
}

.stat__num {
	font: 500 20px / 1.2 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.stat__text {
	font: 600 18px / 1.25 var(--font-body);
	color: var(--text-strong);
}
</style>

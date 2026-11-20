<script setup lang="ts">
import type { WheelCatalogGroup } from '../api-facade/contracts'
import { plural } from '../utils/plural'
import UiBadge from './ui/UiBadge.vue'
import UiIcon from './ui/UiIcon.vue'

const { groups, selectedId } = defineProps<{
	groups: WheelCatalogGroup[]
	selectedId?: number
}>()

const emit = defineEmits<{ select: [group: WheelCatalogGroup] }>()

const nouns: Record<WheelCatalogGroup['kind'], [string, string, string]> = {
	changes: ['пункт', 'пункта', 'пунктов'],
	games: ['игра', 'игры', 'игр'],
}

const meta = (group: WheelCatalogGroup) => {
	if (group.system) return 'у каждого игрока свой'

	const count = group.entries.length

	return `${count} ${plural(count, nouns[group.kind])}`
}
</script>

<template>
	<div class="groups">
		<div class="groups__head">
			<span class="groups__label">Группы</span>
			<slot name="action" />
		</div>

		<slot name="add" />

		<button
			v-for="group in groups"
			:key="group.id"
			class="groups__item"
			:class="{ 'groups__item--on': group.id === selectedId }"
			type="button"
			:aria-pressed="group.id === selectedId"
			@click="emit('select', group)"
		>
			<span class="groups__text">
				<span class="groups__name">{{ group.name }}</span>
				<span class="groups__meta">{{ meta(group) }}</span>
				<UiBadge v-if="group.noRepeat" class="groups__badge" tone="neutral"
					>не повторять</UiBadge
				>
			</span>
			<span v-if="group.system" class="groups__lock" title="Системная группа">
				<UiIcon name="lock" :size="16" />
			</span>
		</button>

		<div v-if="!groups.length" class="groups__empty">Групп пока нет.</div>
	</div>
</template>

<style scoped>
.groups {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 12px 8px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.groups__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 32px;
	padding: 4px 12px 8px;
}

.groups__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.groups__item {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 10px 12px;
	text-align: left;
	background: transparent;
	border: 0;
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.groups__item:hover {
	background: var(--surface-sunken);
}

.groups__item--on,
.groups__item--on:hover {
	background: var(--accent-soft);
	box-shadow: inset 3px 0 0 var(--accent);
}

.groups__text {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.groups__name {
	font: 600 15px / 1.4 var(--font-body);
	color: var(--text-strong);
	overflow-wrap: anywhere;
}

.groups__meta {
	font: var(--type-caption);
	color: var(--text-muted);
}

.groups__badge {
	align-self: flex-start;
	margin-top: 4px;
}

.groups__lock {
	display: flex;
	flex: none;
	color: var(--text-muted);
}

.groups__empty {
	padding: 4px 12px 8px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
}
</style>

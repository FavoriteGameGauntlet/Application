<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AdminWheelGroup } from '../../../api-facade/contracts'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIcon from '../../../components/ui/UiIcon.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'
import { plural } from '../../../utils/plural'

const { selectedId } = defineProps<{ selectedId?: number }>()

const emit = defineEmits<{ select: [group: AdminWheelGroup] }>()

const store = useAdminWheelStore()

const isAdding = ref(false)
const draft = ref('')

const nouns: Record<AdminWheelGroup['kind'], [string, string, string]> = {
	changes: ['пункт', 'пункта', 'пунктов'],
	games: ['игра', 'игры', 'игр'],
}

const meta = (group: AdminWheelGroup) => {
	if (group.system) return 'у каждого игрока свой'

	const count = group.entries.length

	return `${count} ${plural(count, nouns[group.kind])}`
}

const startAdding = () => {
	draft.value = ''
	isAdding.value = true
}

const cancel = () => {
	isAdding.value = false
}

const save = async () => {
	const name = draft.value.trim()

	if (!name) return

	// on a failure the toast is shown and the field stays open for a fix
	if (await store.addGroup(name)) cancel()
}

const onKey = (e: KeyboardEvent) => {
	if (e.key === 'Enter') {
		e.preventDefault()
		save()
	} else if (e.key === 'Escape') {
		cancel()
	}
}

// another tab has other groups
watch(() => store.kind, cancel)
</script>

<template>
	<div class="groups">
		<div class="groups__head">
			<span class="groups__label">Группы</span>
			<UiButton variant="outline" size="sm" icon="plus" @click="startAdding">
				Группа
			</UiButton>
		</div>

		<div v-if="isAdding" class="groups__add">
			<UiInput
				v-model="draft"
				compact
				auto-focus
				placeholder="Название"
				aria-label="Название новой группы"
				@keydown="onKey"
			/>
			<UiIconButton
				icon="check"
				label="Сохранить"
				:disabled="!draft.trim()"
				@click="save"
			/>
			<UiIconButton icon="x" label="Отменить" @click="cancel" />
		</div>

		<button
			v-for="group in store.groups"
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
	padding: 4px 12px 8px;
}

.groups__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.groups__add {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px 4px 8px 12px;
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
</style>

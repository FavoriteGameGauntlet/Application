<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AdminWheelGroup } from '../../../api-facade/contracts'
import UiIcon from '../../../components/ui/UiIcon.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'

/** `{}` is a new group, undefined means no chip is being edited */
type Editing = { group?: AdminWheelGroup }

const { selectedId } = defineProps<{ selectedId?: number }>()

const emit = defineEmits<{
	select: [group: AdminWheelGroup]
	remove: [group: AdminWheelGroup]
}>()

const store = useAdminWheelStore()

const editing = ref<Editing>()
const draft = ref('')

const edit = (group?: AdminWheelGroup) => {
	draft.value = group?.name ?? ''
	editing.value = { group }
}

const cancel = () => {
	editing.value = undefined
}

const select = (group: AdminWheelGroup) => {
	cancel()
	emit('select', group)
}

const remove = (group: AdminWheelGroup) => {
	cancel()
	emit('remove', group)
}

const save = async () => {
	const current = editing.value
	const name = draft.value.trim()

	if (!current || !name) return

	if (name === current.group?.name) {
		cancel()
		return
	}

	const ok = current.group
		? await store.renameGroup(current.group, name)
		: await store.addGroup(name)

	// on a failure the toast is shown and the chip stays open for a fix
	if (ok) cancel()
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
	<div class="chips" role="group" aria-label="Группы">
		<template v-for="g in store.groups" :key="g.id">
			<span v-if="editing?.group?.id === g.id" class="edit">
				<div class="edit__input">
					<UiInput
						v-model="draft"
						compact
						auto-focus
						aria-label="Название группы"
						@keydown="onKey"
					/>
				</div>
				<UiIconButton
					icon="check"
					size="sm"
					label="Сохранить название"
					:disabled="!draft.trim()"
					@click="save"
				/>
				<UiIconButton icon="x" size="sm" label="Отменить" @click="cancel" />
				<UiIconButton
					icon="trash-2"
					size="sm"
					label="Удалить группу"
					@click="remove(g)"
				/>
			</span>

			<span
				v-else
				class="chip"
				:class="{
					'chip--on': g.id === selectedId,
					'chip--pencil': g.id === selectedId && !g.system,
				}"
			>
				<button
					class="chip__name"
					type="button"
					:aria-pressed="g.id === selectedId"
					@click="select(g)"
				>
					{{ g.name }}
				</button>
				<UiIconButton
					v-if="g.id === selectedId && !g.system"
					icon="pencil"
					size="sm"
					label="Переименовать"
					@click="edit(g)"
				/>
			</span>
		</template>

		<span v-if="editing && !editing.group" class="edit">
			<div class="edit__input">
				<UiInput
					v-model="draft"
					compact
					auto-focus
					placeholder="Название"
					aria-label="Название новой группы"
					@keydown="onKey"
				/>
			</div>
			<UiIconButton
				icon="check"
				size="sm"
				label="Создать группу"
				:disabled="!draft.trim()"
				@click="save"
			/>
			<UiIconButton icon="x" size="sm" label="Отменить" @click="cancel" />
		</span>
		<button v-else class="add" type="button" @click="edit()">
			<UiIcon name="plus" :size="16" />
			Группа
		</button>
	</div>
</template>

<style scoped>
.chips {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 2px;
	height: 36px;
	padding-right: 12px;
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
}

.chip--on {
	background: var(--accent-soft);
	box-shadow: inset 0 0 0 1.5px var(--accent);
}

/* the pencil takes the place of the right padding */
.chip--pencil {
	padding-right: 2px;
}

.chip__name {
	height: 100%;
	padding: 0 0 0 14px;
	font: 500 14px / 1 var(--font-body);
	color: var(--text-strong);
	cursor: pointer;
}

.edit {
	display: inline-flex;
	align-items: center;
	gap: 4px;
}

.edit__input {
	width: 190px;
}

.add {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 12px 0 8px;
	font: 600 14px / 1 var(--font-body);
	color: var(--text-muted);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.add:hover {
	background: var(--surface-sunken);
}
</style>

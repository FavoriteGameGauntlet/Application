<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AdminWheelGroup } from '../../../api-facade/contracts'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiTabs from '../../../components/ui/UiTabs.vue'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'

/** `{}` is a new group, otherwise the selected group is renamed; undefined means nothing is edited */
type Editing = { group?: AdminWheelGroup }

const { selectedId } = defineProps<{ selectedId?: number }>()

const emit = defineEmits<{
	select: [group: AdminWheelGroup]
	remove: [group: AdminWheelGroup]
}>()

const store = useAdminWheelStore()

const editing = ref<Editing>()
const draft = ref('')

const tabs = computed(() =>
	store.groups.map((g) => ({ value: String(g.id), label: g.name })),
)

const selected = computed(() => store.groups.find((g) => g.id === selectedId))

const edit = (group?: AdminWheelGroup) => {
	draft.value = group?.name ?? ''
	editing.value = { group }
}

const cancel = () => {
	editing.value = undefined
}

const select = (id?: string) => {
	const group = store.groups.find((g) => String(g.id) === id)

	if (!group) return

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

	// on a failure the toast is shown and the field stays open for a fix
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
	<div class="groups">
		<div class="groups__tabs">
			<UiTabs
				variant="pill"
				:items="tabs"
				:model-value="selectedId === undefined ? undefined : String(selectedId)"
				aria-label="Группы"
				@update:model-value="select"
			/>
		</div>

		<div v-if="editing" class="groups__edit">
			<div class="groups__input">
				<UiInput
					v-model="draft"
					compact
					auto-focus
					:placeholder="editing.group ? undefined : 'Название'"
					:aria-label="
						editing.group ? 'Название группы' : 'Название новой группы'
					"
					@keydown="onKey"
				/>
			</div>
			<UiIconButton
				icon="check"
				label="Сохранить"
				:disabled="!draft.trim()"
				@click="save"
			/>
			<UiIconButton icon="x" label="Отменить" @click="cancel" />
			<UiIconButton
				v-if="editing.group"
				icon="trash-2"
				label="Удалить группу"
				@click="remove(editing.group)"
			/>
		</div>

		<div v-else class="groups__actions">
			<UiIconButton
				v-if="selected && !selected.system"
				icon="pencil"
				label="Переименовать"
				@click="edit(selected)"
			/>
			<UiButton variant="ghost" size="sm" icon="plus" @click="edit()">
				Группа
			</UiButton>
		</div>
	</div>
</template>

<style scoped>
.groups {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

/* many groups scroll in their own bar instead of pushing the page wider */
.groups__tabs {
	max-width: 100%;
	min-width: 0;
	overflow-x: auto;
}

.groups__tabs :deep(.ui-tabs__tab) {
	flex: none;
	white-space: nowrap;
}

.groups__edit,
.groups__actions {
	display: flex;
	gap: 4px;
	align-items: center;
}

.groups__input {
	width: 220px;
}
</style>

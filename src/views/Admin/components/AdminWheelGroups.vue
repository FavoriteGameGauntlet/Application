<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WheelCatalogGroup } from '../../../api-facade/contracts'
import WheelGroupList from '../../../components/WheelGroupList.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'

const { selectedId } = defineProps<{ selectedId?: number }>()

const emit = defineEmits<{ select: [group: WheelCatalogGroup] }>()

const store = useAdminWheelStore()

const isAdding = ref(false)
const draft = ref('')

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
	<WheelGroupList
		:groups="store.groups"
		:selected-id
		@select="emit('select', $event)"
	>
		<template #action>
			<UiButton variant="outline" size="sm" icon="plus" @click="startAdding">
				Группа
			</UiButton>
		</template>

		<template v-if="isAdding" #add>
			<div class="add">
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
		</template>
	</WheelGroupList>
</template>

<style scoped>
.add {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px 4px 8px 12px;
}
</style>

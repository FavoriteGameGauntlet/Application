<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WheelCatalogGroup } from '../../../api-facade/contracts'
import WheelGroupCard from '../../../components/WheelGroupCard.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'
import AdminSpinCost from './AdminSpinCost.vue'

const { group } = defineProps<{ group: WheelCatalogGroup }>()

const emit = defineEmits<{ remove: [] }>()

const store = useAdminWheelStore()

const isRenaming = ref(false)
const draft = ref('')

const startRename = () => {
	draft.value = group.name
	isRenaming.value = true
}

const cancel = () => {
	isRenaming.value = false
}

const save = async () => {
	const name = draft.value.trim()

	if (!name) return

	if (name === group.name) {
		cancel()
		return
	}

	// on a failure the toast is shown and the field stays open for a fix
	if (await store.renameGroup(group, name)) cancel()
}

const onKey = (e: KeyboardEvent) => {
	if (e.key === 'Enter') {
		e.preventDefault()
		save()
	} else if (e.key === 'Escape') {
		cancel()
	}
}

watch(() => group.id, cancel)
</script>

<template>
	<WheelGroupCard :group editable @no-repeat="store.setNoRepeat(group, $event)">
		<template v-if="isRenaming" #name>
			<div class="rename">
				<div class="rename__input">
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
					label="Сохранить"
					:disabled="!draft.trim()"
					@click="save"
				/>
				<UiIconButton icon="x" label="Отменить" @click="cancel" />
			</div>
		</template>

		<template v-if="!group.system && !isRenaming" #actions>
			<UiIconButton
				icon="pencil"
				label="Переименовать группу"
				@click="startRename"
			/>
			<UiIconButton
				icon="trash-2"
				label="Удалить группу"
				@click="emit('remove')"
			/>
		</template>

		<template #cost-action>
			<AdminSpinCost :key="group.id" :group />
		</template>

		<p v-if="group.system" class="text">
			Список желаемого у каждого игрока свой. Игры в него добавляют сами игроки
			на экране «Игры», здесь список не редактируется.
		</p>
	</WheelGroupCard>
</template>

<style scoped>
.rename {
	display: flex;
	align-items: center;
	gap: 4px;
}

.rename__input {
	width: 260px;
}

.text {
	margin: 0;
	padding-top: 14px;
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
	border-top: 1px solid var(--border-subtle);
}
</style>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AdminWheelGroup } from '../../../api-facade/contracts'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiSwitch from '../../../components/ui/UiSwitch.vue'
import { useAdminWheelStore } from '../../../stores/adminWheelStore'
import AdminSpinCost from './AdminSpinCost.vue'

const { group } = defineProps<{ group: AdminWheelGroup }>()

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
	<div class="card">
		<div class="card__head">
			<div v-if="isRenaming" class="card__rename">
				<div class="card__input">
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
			<span v-else class="card__name">{{ group.name }}</span>

			<UiSwitch
				v-if="!group.system"
				:model-value="group.noRepeat"
				label="Не повторять выпавшее"
				@update:model-value="store.setNoRepeat(group, $event)"
			/>

			<div class="card__spacer"></div>

			<template v-if="!group.system && !isRenaming">
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
		</div>

		<AdminSpinCost v-if="group.kind === 'changes'" :key="group.id" :group />

		<p v-if="group.system" class="card__text">
			Список желаемого у каждого игрока свой. Игры в него добавляют сами игроки
			на экране «Игры», здесь список не редактируется.
		</p>
	</div>
</template>

<style scoped>
.card {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px 20px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card__head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 16px;
	min-height: 36px;
}

.card__name {
	min-width: 0;
	font: 700 20px / 1.2 var(--font-body);
	color: var(--text-strong);
	overflow-wrap: anywhere;
}

.card__rename {
	display: flex;
	align-items: center;
	gap: 4px;
}

.card__input {
	width: 260px;
}

.card__spacer {
	flex: 1;
}

.card__text {
	margin: 0;
	padding-top: 14px;
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
	border-top: 1px solid var(--border-subtle);
}
</style>

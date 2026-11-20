<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type {
	ApplyMode,
	WheelCatalogEntry,
	WheelCatalogGroup,
} from '../../api-facade/contracts'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import type {
	FormRow,
	FormSection,
	FormValues,
} from '../../components/formDialog'
import { applyModeOptions } from '../../utils/applyMode'
import { changeRowsToForm, parseChangeRows } from '../../utils/formRows'
import FormDialog from '../../components/FormDialog.vue'
import InlineAddRow from '../../components/InlineAddRow.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import type { RowMenuItem } from '../../components/ui/UiRowMenu.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import WheelEntryTable from '../../components/WheelEntryTable.vue'
import { useAdminWheelStore } from '../../stores/adminWheelStore'
import { useToastStore } from '../../stores/toastStore'
import AdminWheelGroupCard from './components/AdminWheelGroupCard.vue'
import AdminWheelGroups from './components/AdminWheelGroups.vue'

/** `{}` adds an item of changes, undefined means the dialog is closed */
type Dialog = { entry?: WheelCatalogEntry }

type Confirm = { title: string; text: string; run: () => void }

const store = useAdminWheelStore()
const toastStore = useToastStore()

const tabs = [
	{ value: 'changes', label: 'Пункты' },
	{ value: 'games', label: 'Игры' },
]

const dialog = ref<Dialog>()
const confirm = ref<Confirm>()

const isChanges = computed(() => store.kind === 'changes')
const group = computed(() => store.group)

const query = ref('')
const newGame = ref('')

/** the rows of the open dialog: with none there is nothing to choose from */
const hasRows = ref(false)

const sections = computed<FormSection[]>(() => {
	// a game has only a name, the backend takes nothing else for it
	if (!isChanges.value) {
		return [
			{
				fields: [
					{
						key: 'name',
						label: 'Игра',
						required: 'название',
						placeholder: 'Hades',
					},
				],
			},
		]
	}

	return [
		{
			fields: [
				{
					key: 'name',
					label: 'Название',
					required: 'название',
					placeholder: '+50 золота',
				},
				{
					key: 'description',
					label: 'Описание',
					type: 'area',
					optional: true,
					placeholder: 'Что произойдёт — так увидят игроки',
				},
			],
		},
		{
			title: 'Когда выпал',
			aside: {
				key: 'applies',
				type: 'segment',
				label: 'Что применяется',
				options: applyModeOptions,
				disabled: !hasRows.value,
			},
			fields: [
				{
					key: 'entries',
					label: '',
					required: 'действие',
					requiredUnless: { key: 'isManualChange', is: true },
					type: 'rows',
					variant: 'change',
					addLabel: 'Действие',
				},
				{
					key: 'isManualChange',
					type: 'check',
					label: 'Потом ручное изменение',
				},
			],
		},
	]
})

const onChange = (values: FormValues) => {
	hasRows.value = (values.entries as FormRow[] | undefined)?.length !== 0
}

const initial = computed<FormValues>(() => {
	const current = dialog.value

	const values: FormValues = {
		name: '',
		description: '',
		entries: [],
		isManualChange: false,
		applies: 'all',
	}

	if (current?.entry) {
		values.name = current.entry.name
		values.description = current.entry.description ?? ''
		values.entries = changeRowsToForm(current.entry.entries)
		values.isManualChange = current.entry.isManualChange
		values.applies = current.entry.applyMode
	}

	return values
})

watch(initial, (values) => {
	hasRows.value = (values.entries as FormRow[]).length > 0
})

const dialogTitle = computed(() => {
	if (dialog.value?.entry)
		return isChanges.value ? 'Изменить пункт' : 'Изменить игру'

	return 'Новый пункт'
})

const dialogSubtitle = computed(() =>
	group.value ? `Группа «${group.value.name}»` : undefined,
)

const submitLabel = computed(() =>
	dialog.value?.entry ? 'Сохранить' : 'Добавить',
)

const onSave = async (values: FormValues) => {
	const current = dialog.value
	const name = String(values.name).trim()
	const description = String(values.description ?? '').trim()

	if (!group.value) return

	const entries = isChanges.value
		? parseChangeRows(values.entries as FormRow[])
		: { value: [] }

	if ('error' in entries) {
		toastStore.show('Проверь изменения', entries.error, 'danger')
		return
	}

	const isManualChange = isChanges.value && values.isManualChange === true

	const input = {
		name,
		description,
		entries: entries.value,
		isManualChange,
		applyMode: values.applies as ApplyMode,
	}

	if (await store.saveEntry(group.value, current?.entry, input))
		dialog.value = undefined
}

const askRemoveGroup = (target: WheelCatalogGroup) => {
	confirm.value = {
		title: `Удалить группу «${target.name}»?`,
		text: `Пропадут все ${isChanges.value ? 'пункты' : 'игры'} группы (${target.entries.length}). Уже выпавшие останутся в журнале.`,
		run: () => store.removeGroup(target),
	}
}

const askRemoveEntry = (
	target: WheelCatalogGroup,
	entry: WheelCatalogEntry,
) => {
	confirm.value = {
		title: isChanges.value ? 'Удалить пункт?' : 'Убрать игру из списка?',
		text: `«${entry.name}» больше не выпадет на колесе.`,
		run: () => store.removeEntry(target, entry),
	}
}

const onConfirm = () => {
	const current = confirm.value

	confirm.value = undefined
	current?.run()
}

const menuOf = (
	target: WheelCatalogGroup,
	entry: WheelCatalogEntry,
): RowMenuItem[] => [
	{
		label: 'Изменить',
		icon: 'pencil',
		select: () => (dialog.value = { entry }),
	},
	{
		label: 'Удалить',
		icon: 'trash-2',
		danger: true,
		select: () => askRemoveEntry(target, entry),
	},
]

const addGame = async (name: string) => {
	if (!group.value) return

	const added = await store.saveEntry(group.value, undefined, {
		name,
		description: '',
		entries: [],
		isManualChange: false,
		applyMode: 'all',
	})

	if (added) newGame.value = ''
}

const selectGroup = (target: WheelCatalogGroup) => {
	store.groupId = target.id
	query.value = ''
	newGame.value = ''
}

const setKind = (value: string) => {
	query.value = ''
	newGame.value = ''
	store.setKind(value as 'changes' | 'games')
}

onMounted(() => store.load())
</script>

<template>
	<div class="wheel">
		<UiPageTitle>Колесо</UiPageTitle>

		<UiTabs
			:model-value="store.kind"
			:items="tabs"
			@update:model-value="setKind($event!)"
		/>

		<div class="layout">
			<AdminWheelGroups :selected-id="group?.id" @select="selectGroup" />

			<div v-if="group" class="main">
				<AdminWheelGroupCard :group @remove="askRemoveGroup(group)" />

				<WheelEntryTable
					v-if="!group.system"
					v-model:query="query"
					:group
					:menu-of="(entry) => menuOf(group!, entry)"
					:empty-text="
						isChanges
							? 'В группе нет пунктов. Нажми «Пункт».'
							: 'В списке нет игр. Впиши название ниже.'
					"
				>
					<template v-if="isChanges" #action>
						<UiButton icon="plus" @click="dialog = {}">Пункт</UiButton>
					</template>

					<template v-if="!isChanges" #add>
						<div class="add">
							<InlineAddRow
								v-model="newGame"
								placeholder="Название игры"
								label="Название новой игры"
								@submit="addGame"
							/>
						</div>
					</template>
				</WheelEntryTable>
			</div>
		</div>
	</div>

	<FormDialog
		:open="!!dialog"
		:title="dialogTitle"
		:subtitle="dialogSubtitle"
		:submit-label
		:sections
		:initial
		@close="dialog = undefined"
		@save="onSave"
		@change="onChange"
	/>

	<ConfirmDialog
		:open="!!confirm"
		:title="confirm?.title ?? ''"
		:text="confirm?.text ?? ''"
		@close="confirm = undefined"
		@confirm="onConfirm"
	/>
</template>

<style scoped>
.wheel {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.layout {
	display: grid;
	grid-template-columns: 256px minmax(0, 1fr);
	gap: 20px;
	align-items: start;
}

.main {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}

.add {
	padding: 8px 12px 8px 20px;
	border-top: 1px solid var(--border-subtle);
}
</style>

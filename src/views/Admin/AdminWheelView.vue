<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type {
	AdminWheelEntry,
	AdminWheelGroup,
} from '../../api-facade/contracts'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import type {
	FormField,
	FormRow,
	FormValues,
} from '../../components/formDialog'
import { changeRowsToForm, parseChangeRows } from '../../utils/formRows'
import FormDialog from '../../components/FormDialog.vue'
import { changeTone } from '../../components/catalogTable'
import InlineAddRow from '../../components/InlineAddRow.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCountBadge from '../../components/ui/UiCountBadge.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiRowMenu, { type RowMenuItem } from '../../components/ui/UiRowMenu.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { useAdminWheelStore } from '../../stores/adminWheelStore'
import { useToastStore } from '../../stores/toastStore'
import AdminWheelGroupCard from './components/AdminWheelGroupCard.vue'
import AdminWheelGroups from './components/AdminWheelGroups.vue'

/** `{}` adds an item of changes, undefined means the dialog is closed */
type Dialog = { entry?: AdminWheelEntry }

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

const foundEntries = computed(() => {
	const q = query.value.trim().toLowerCase()

	return (group.value?.entries ?? []).filter(
		(e) =>
			!q ||
			[e.name, e.description ?? '', ...e.changes].some((s) =>
				s.toLowerCase().includes(q),
			),
	)
})

const fields = computed<FormField[]>(() => {
	// a game has only a name, the backend takes nothing else for it
	if (!isChanges.value) {
		return [
			{
				key: 'name',
				label: 'Игра',
				required: 'название',
				placeholder: 'Hades',
			},
		]
	}

	return [
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
		{
			key: 'entries',
			label: 'Когда выпал',
			required: 'действие',
			requiredUnless: { key: 'isManualChange', is: true },
			type: 'rows',
			variant: 'change',
			addLabel: 'Действие',
		},
		{
			key: 'isManualChange',
			type: 'check',
			label: 'Остальное игрок вносит сам',
		},
		{
			key: 'chooseEntries',
			type: 'check',
			label: 'Игрок выбирает, что применить',
		},
	]
})

const initial = computed<FormValues>(() => {
	const current = dialog.value

	const values: FormValues = {
		name: '',
		description: '',
		entries: [],
		isManualChange: false,
		chooseEntries: false,
	}

	if (current?.entry) {
		values.name = current.entry.name
		values.description = current.entry.description ?? ''
		values.entries = changeRowsToForm(current.entry.entries)
		values.isManualChange = current.entry.isManualChange
		values.chooseEntries = !current.entry.shouldApplyToAll
	}

	return values
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
	dialog.value?.entry ? 'Сохранить' : 'Добавить пункт',
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
		shouldApplyToAll: values.chooseEntries !== true,
	}

	if (await store.saveEntry(group.value, current?.entry, input))
		dialog.value = undefined
}

const askRemoveGroup = (target: AdminWheelGroup) => {
	confirm.value = {
		title: `Удалить группу «${target.name}»?`,
		text: `Пропадут все ${isChanges.value ? 'пункты' : 'игры'} группы (${target.entries.length}). Уже выпавшие останутся в журнале.`,
		run: () => store.removeGroup(target),
	}
}

const askRemoveEntry = (target: AdminWheelGroup, entry: AdminWheelEntry) => {
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

/** a change in its row: green adds, red takes */
const tagsOf = (entry: AdminWheelEntry) =>
	entry.changes.map((text, i) => ({
		text,
		tone: changeTone(entry.entries[i]?.amount ?? 0),
	}))

const menuOf = (
	target: AdminWheelGroup,
	entry: AdminWheelEntry,
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
		shouldApplyToAll: true,
	})

	if (added) newGame.value = ''
}

const selectGroup = (target: AdminWheelGroup) => {
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

				<template v-if="!group.system">
					<div class="bar">
						<span class="bar__label">{{
							isChanges ? 'Пункты группы' : 'Игры группы'
						}}</span>
						<UiCountBadge :value="foundEntries.length" />
						<div class="bar__spacer"></div>
						<div class="bar__search">
							<UiInput
								v-model="query"
								compact
								icon="search"
								:placeholder="isChanges ? 'Найти пункт…' : 'Найти игру…'"
								aria-label="Поиск"
							/>
						</div>
						<UiButton v-if="isChanges" icon="plus" @click="dialog = {}">
							Пункт
						</UiButton>
					</div>

					<div
						class="table"
						:class="{ 'table--changes': isChanges }"
						role="table"
						:aria-label="isChanges ? 'Пункты группы' : 'Игры группы'"
					>
						<div class="row row--head" role="row">
							<span role="columnheader">{{
								isChanges ? 'Пункт' : 'Игра'
							}}</span>
							<template v-if="isChanges">
								<span role="columnheader">Изменение</span>
								<span role="columnheader">Как применяется</span>
							</template>
						</div>

						<UiRowMenu
							v-for="entry in foundEntries"
							:key="entry.id"
							class="row"
							role="row"
							:label="isChanges ? 'Действия с пунктом' : 'Действия с игрой'"
							:items="menuOf(group, entry)"
						>
							<div class="cell cell--name" role="cell">
								<span class="name">{{ entry.name }}</span>
								<span v-if="isChanges && entry.description" class="desc">{{
									entry.description
								}}</span>
							</div>

							<template v-if="isChanges">
								<div class="cell cell--wrap" role="cell">
									<span
										v-for="(tag, i) in tagsOf(entry)"
										:key="i"
										class="tag"
										:class="`tag--${tag.tone}`"
										>{{ tag.text }}</span
									>
									<span v-if="!entry.changes.length" class="muted">—</span>
								</div>

								<div class="cell cell--wrap" role="cell">
									<span v-if="entry.isManualChange" class="fact">вручную</span>
									<span v-if="!entry.shouldApplyToAll" class="fact"
										>на выбор</span
									>
								</div>
							</template>
						</UiRowMenu>

						<div v-if="!foundEntries.length" class="empty">
							{{
								group.entries.length
									? 'Ничего не найдено.'
									: isChanges
										? 'В группе нет пунктов. Нажми «Пункт».'
										: 'В списке нет игр. Впиши название ниже.'
							}}
						</div>

						<div v-if="!isChanges" class="add">
							<InlineAddRow
								v-model="newGame"
								placeholder="Название игры"
								label="Название новой игры"
								@submit="addGame"
							/>
						</div>
					</div>
				</template>
			</div>
		</div>
	</div>

	<FormDialog
		:open="!!dialog"
		:title="dialogTitle"
		:subtitle="dialogSubtitle"
		:submit-label
		:sections="[{ fields }]"
		:initial
		@close="dialog = undefined"
		@save="onSave"
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

.bar {
	display: flex;
	align-items: center;
	gap: 12px;
}

.bar__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.bar__spacer {
	flex: 1;
}

.bar__search {
	width: 240px;
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

/* 60px on the right belong to the «⋯» button */
.row {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 16px;
	align-items: start;
	padding: 14px 60px 14px 20px;
	border-top: 1px solid var(--border-subtle);
}

.table--changes .row {
	grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.2fr) minmax(0, 0.9fr);
}

.row--head {
	padding-block: 12px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
	border-top: 0;
}

.row:not(.row--head):hover {
	background: var(--surface-sunken);
}

.cell {
	min-width: 0;
}

.cell--name {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.cell--wrap {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.name {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
	overflow-wrap: anywhere;
}

.desc {
	font: var(--type-caption);
	color: var(--text-muted);
	text-wrap: pretty;
}

.tag,
.fact {
	display: inline-flex;
	align-items: center;
	height: 26px;
	padding: 0 10px;
	font: 500 12px / 1 var(--font-body);
	color: var(--text-body);
	white-space: nowrap;
	border-radius: var(--radius-pill);
}

.tag {
	background: var(--surface-sunken);
}

.tag--plus {
	color: var(--success-text);
	background: var(--success-soft);
}

.tag--minus {
	color: var(--danger-text);
	background: var(--danger-soft);
}

.fact {
	border: var(--border-width) solid var(--border-default);
}

.muted {
	font: var(--type-caption);
	color: var(--text-muted);
}

.empty {
	padding: 16px 20px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}

.add {
	padding: 8px 12px 8px 20px;
	border-top: 1px solid var(--border-subtle);
}
</style>

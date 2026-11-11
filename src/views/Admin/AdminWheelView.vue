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
import UiButton from '../../components/ui/UiButton.vue'
import UiCheckbox from '../../components/ui/UiCheckbox.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import UiTag from '../../components/ui/UiTag.vue'
import { useAdminWheelStore } from '../../stores/adminWheelStore'
import { useToastStore } from '../../stores/toastStore'
import { plural } from '../../utils/plural'
import AdminSpinCost from './components/AdminSpinCost.vue'

type Dialog =
	| { kind: 'group'; group?: AdminWheelGroup }
	| { kind: 'entry'; entry?: AdminWheelEntry }

type Confirm = { title: string; text: string; run: () => void }

const store = useAdminWheelStore()
const toastStore = useToastStore()

const tabs = [
	{ value: 'changes', label: 'Пункты' },
	{ value: 'games', label: 'Игры' },
]

const dialog = ref<Dialog>()
const confirm = ref<Confirm>()
const openEntryId = ref<number>()

const isChanges = computed(() => store.kind === 'changes')
const group = computed(() => store.group)

const query = ref('')

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

const groupMeta = (g: AdminWheelGroup) => {
	const count = g.entries.length
	const what = isChanges.value
		? `${count} ${plural(count, ['пункт', 'пункта', 'пунктов'])}`
		: `${count} ${plural(count, ['игра', 'игры', 'игр'])}`

	return `${g.system ? 'у каждого игрока свой' : what}${g.noRepeat ? ' · не повторять' : ''}`
}

const note = computed(() =>
	isChanges.value
		? '«Не повторять выпавшее» — пункт не выпадет игроку снова, пока не выпадут остальные. «Вручную» — изменения игрок вносит сам после прокрута.'
		: 'Выпавшая игра становится текущей. «Не повторять выпавшее» — игра не выпадет снова, пока не выпадут остальные из списка.',
)

const fields = computed<FormField[]>(() => {
	if (dialog.value?.kind === 'group') {
		return [
			{
				key: 'name',
				label: 'Название',
				required: 'название',
				placeholder: 'Бонусы',
			},
		]
	}

	if (!isChanges.value) {
		return [
			{
				key: 'name',
				label: 'Игра',
				required: 'название',
				placeholder: 'Hades',
			},
			{
				key: 'description',
				label: 'Описание',
				type: 'area',
				placeholder: 'Почему игра в этом списке',
				hint: 'Необязательно.',
			},
		]
	}

	return [
		{
			key: 'name',
			label: 'Пункт',
			required: 'название',
			placeholder: '+50 золота',
		},
		{
			key: 'description',
			label: 'Описание',
			type: 'area',
			placeholder: 'Что произойдёт — так увидят игроки',
			hint: 'Необязательно. Показывается игроку, когда пункт выпал.',
		},
		{
			key: 'entries',
			label: 'Изменение',
			type: 'rows',
			variant: 'change',
			hint: 'Применится само тем, кому достался пункт. Минус забирает.',
		},
		{
			key: 'isManualChange',
			type: 'check',
			label: 'Игрок вносит изменение вручную',
			hint: 'После прокрута откроется форма ручного изменения.',
		},
		{
			key: 'chooseEntries',
			type: 'check',
			label: 'Игрок выбирает, что применить',
			hint: 'Когда пункт выпадет, игрок отметит изменения, которые сработают. Остальные пропустятся.',
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

	if (current?.kind === 'group') {
		values.name = current.group?.name ?? ''
	} else if (current?.entry) {
		values.name = current.entry.name
		values.description = current.entry.description ?? ''
		values.entries = changeRowsToForm(current.entry.entries)
		values.isManualChange = current.entry.isManualChange
		values.chooseEntries = !current.entry.shouldApplyToAll
	}

	return values
})

const dialogTitle = computed(() => {
	const current = dialog.value

	if (current?.kind === 'group') {
		return current.group ? 'Переименовать группу' : 'Новая группа'
	}

	if (current?.entry)
		return isChanges.value ? 'Изменить пункт' : 'Изменить игру'

	return `${isChanges.value ? 'Новый пункт' : 'Новая игра'} · ${group.value?.name}`
})

const onSave = async (values: FormValues) => {
	const current = dialog.value
	const name = String(values.name).trim()
	const description = String(values.description ?? '').trim()

	if (current?.kind === 'group') {
		const ok = current.group
			? await store.renameGroup(current.group, name)
			: await store.addGroup(name)

		if (ok) dialog.value = undefined
		return
	}

	if (!group.value) return

	const entries = isChanges.value
		? parseChangeRows(values.entries as FormRow[])
		: { value: [] }

	if ('error' in entries) {
		toastStore.show('Проверь изменения', entries.error, 'danger')
		return
	}

	const isManualChange = isChanges.value && values.isManualChange === true

	if (isChanges.value && !entries.value.length && !isManualChange) {
		toastStore.show(
			'Добавь изменение',
			'Или отметь, что игрок вносит его вручную.',
			'danger',
		)
		return
	}

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

const selectGroup = (target: AdminWheelGroup) => {
	store.groupId = target.id
	openEntryId.value = undefined
	query.value = ''
}

const setKind = (value: string) => {
	openEntryId.value = undefined
	query.value = ''
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
			<div class="groups">
				<div class="groups__head">
					<span class="groups__title">Группы</span>
					<UiButton
						variant="ghost"
						size="sm"
						icon="plus"
						@click="dialog = { kind: 'group' }"
					>
						Группа
					</UiButton>
				</div>

				<div
					v-for="g in store.groups"
					:key="g.id"
					class="group"
					:class="{ 'group--on': g.id === group?.id }"
					@click="selectGroup(g)"
				>
					<div class="group__info">
						<span class="group__name">{{ g.name }}</span>
						<span class="group__meta">{{ groupMeta(g) }}</span>
					</div>

					<template v-if="!g.system">
						<UiIconButton
							icon="pencil"
							size="sm"
							label="Переименовать"
							@click.stop="dialog = { kind: 'group', group: g }"
						/>
						<UiIconButton
							icon="trash-2"
							size="sm"
							label="Удалить"
							@click.stop="askRemoveGroup(g)"
						/>
					</template>
				</div>
			</div>

			<div v-if="group" class="main">
				<div class="card">
					<span class="card__accent"></span>
					<span class="card__name">{{ group.name }}</span>
					<div v-if="!group.system" class="card__search">
						<UiInput
							v-model="query"
							compact
							icon="search"
							placeholder="Найти…"
							aria-label="Поиск"
						/>
					</div>
					<UiCheckbox
						:model-value="group.noRepeat"
						label="Не повторять выпавшее"
						@update:model-value="store.setNoRepeat(group, $event)"
					/>
					<UiButton
						v-if="!group.system"
						icon="plus"
						@click="dialog = { kind: 'entry' }"
					>
						{{ isChanges ? 'Пункт' : 'Игра' }}
					</UiButton>
				</div>

				<AdminSpinCost v-if="isChanges" :key="group.id" :group />

				<div v-if="group.system" class="card card--text">
					Вишлист у каждого игрока свой. Игры в него добавляют сами игроки на
					экране «Игры», здесь список не редактируется.
				</div>

				<div v-else class="table">
					<div
						class="table__row table__row--head"
						:class="{ 'table__row--wide': isChanges }"
					>
						<span class="table__name-head">{{
							isChanges ? 'Пункт' : 'Игра'
						}}</span>
						<span v-if="isChanges">Изменение</span>
						<span></span>
					</div>

					<div
						v-for="entry in foundEntries"
						:key="entry.id"
						class="item"
						:class="{ 'item--open': openEntryId === entry.id }"
					>
						<div
							class="table__row table__row--body"
							:class="{ 'table__row--wide': isChanges }"
							@click="
								openEntryId = openEntryId === entry.id ? undefined : entry.id
							"
						>
							<div class="cell cell--name">
								<span class="cell__chevron">
									<UiIcon
										:name="
											openEntryId === entry.id
												? 'chevron-down'
												: 'chevron-right'
										"
										:size="16"
									/>
								</span>
								<span class="cell__title">{{ entry.name }}</span>
							</div>

							<div v-if="isChanges" class="cell cell--tags">
								<UiTag v-for="tag in entry.changes" :key="tag">{{ tag }}</UiTag>
								<span v-if="entry.isManualChange" class="cell__manual"
									>вручную</span
								>
								<span v-if="!entry.shouldApplyToAll" class="cell__manual"
									>на выбор</span
								>
							</div>

							<span class="table__actions">
								<UiIconButton
									icon="pencil"
									size="sm"
									label="Изменить"
									@click.stop="dialog = { kind: 'entry', entry }"
								/>
								<UiIconButton
									icon="trash-2"
									size="sm"
									label="Удалить"
									@click.stop="askRemoveEntry(group, entry)"
								/>
							</span>
						</div>

						<div v-if="openEntryId === entry.id" class="item__desc">
							<span class="item__label">Описание</span>
							<span class="item__text">{{
								entry.description || 'Без описания'
							}}</span>
						</div>
					</div>

					<div v-if="!foundEntries.length" class="table__empty">
						{{
							group.entries.length
								? 'Ничего не найдено.'
								: isChanges
									? 'В группе нет пунктов. Нажми «Пункт».'
									: 'В списке нет игр. Нажми «Игра».'
						}}
					</div>
				</div>

				<span class="note">{{ note }}</span>
			</div>
		</div>
	</div>

	<FormDialog
		:open="!!dialog"
		:title="dialogTitle"
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
	grid-template-columns: 280px minmax(0, 1fr);
	gap: 20px;
	align-items: start;
}

.groups {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.groups__head {
	display: flex;
	align-items: center;
	gap: 8px;
	box-sizing: border-box;
	height: 48px;
	padding: 0 8px 0 16px;
	background: var(--surface-sunken);
}

.groups__title {
	flex: 1;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.group {
	position: relative;
	display: flex;
	align-items: center;
	gap: 4px;
	box-sizing: border-box;
	min-height: 58px;
	padding: 10px 8px 10px 16px;
	cursor: pointer;
	border-top: 1px solid var(--border-subtle);
}

.group:hover,
.group--on {
	background: var(--surface-sunken);
}

.group--on::before {
	content: '';
	position: absolute;
	left: 0;
	top: 10px;
	bottom: 10px;
	width: 3px;
	background: var(--accent);
	border-radius: 2px;
}

.group__info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.group__name {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.group__meta {
	font: var(--type-caption);
	color: var(--text-muted);
}

.main {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}

.card {
	position: relative;
	display: flex;
	align-items: center;
	gap: 20px;
	box-sizing: border-box;
	min-height: 66px;
	padding: 12px 16px 12px 20px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card__search {
	width: 220px;
}

.card--text {
	padding: 16px;
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
}

.card__accent {
	position: absolute;
	top: 0;
	left: 20px;
	width: 40px;
	height: 4px;
	background: var(--accent);
	border-radius: 0 0 2px 2px;
}

.card__name {
	flex: 1;
	min-width: 0;
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.table__row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 76px;
	gap: 12px;
	align-items: center;
}

.table__row--wide {
	grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.5fr) 76px;
}

.table__row--head {
	padding: 12px 16px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__name-head {
	padding-left: 24px;
}

.table__row--body {
	min-height: 52px;
	padding: 10px 16px;
	cursor: pointer;
}

.table__row--body:hover {
	background: var(--surface-sunken);
}

.table__actions {
	display: flex;
	gap: 4px;
	justify-content: flex-end;
}

.table__empty {
	padding: 16px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}

.item {
	border-top: 1px solid var(--border-subtle);
}

.item--open {
	background: var(--surface-sunken);
}

.cell {
	min-width: 0;
}

.cell--name {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}

.cell__chevron {
	display: flex;
	flex: none;
	margin-top: 3px;
	color: var(--text-muted);
}

.cell__title {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.cell--tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.cell__manual {
	font: var(--type-body-sm);
	color: var(--text-subtle);
}

.item__desc {
	display: flex;
	flex-direction: column;
	gap: 6px;
	max-width: 720px;
	padding: 0 16px 16px 40px;
}

.item__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.item__text {
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
}

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}
</style>

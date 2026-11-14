<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { PartyMember } from '../../api-facade/contracts'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import type { FormField, FormValues } from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiChoiceChips from '../../components/ui/UiChoiceChips.vue'
import UiRowMenu, { type RowMenuItem } from '../../components/ui/UiRowMenu.vue'
import UiUserAvatar from '../../components/ui/UiUserAvatar.vue'
import { useAdminSettingsStore } from '../../stores/adminSettingsStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useToastStore } from '../../stores/toastStore'
import { formatDate } from '../../utils/format'
import { isMemberColor, nextMemberColor } from '../../utils/memberColor'
import AdminListHeader from './components/AdminListHeader.vue'

type Filter = 'all' | 'admins' | 'players' | 'left'

const store = useAdminSettingsStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

/** the member in the edit dialog, undefined means the dialog is closed */
const editing = ref<PartyMember>()
const removing = ref<PartyMember>()
const isAdding = ref(false)
/** the refusal of the last «Добавить», for the login that was typed */
const addError = ref<string>()
let refusedLogin = ''

const query = ref('')
const filter = ref<Filter>('all')

const current = computed(() => store.members.filter((m) => !m.leftDate))

const filters = computed(() => {
	const admins = current.value.filter((m) => m.isAdmin).length

	return [
		{ value: 'all', label: 'Все', count: store.members.length },
		{ value: 'admins', label: 'Админы', count: admins },
		{ value: 'players', label: 'Игроки', count: current.value.length - admins },
		{
			value: 'left',
			label: 'Вышли',
			count: store.members.length - current.value.length,
		},
	]
})

const inFilter = (m: PartyMember) => {
	if (filter.value === 'all') return true
	if (filter.value === 'left') return !!m.leftDate

	return !m.leftDate && m.isAdmin === (filter.value === 'admins')
}

/** those who left stay in the list so that an admin can bring them back, they go last */
const rows = computed(() => {
	const q = query.value.trim().toLowerCase()

	return store.members
		.filter(
			(m) =>
				inFilter(m) &&
				(!q ||
					m.login.toLowerCase().includes(q) ||
					m.displayName?.toLowerCase().includes(q)),
		)
		.sort((a, b) => Number(!!a.leftDate) - Number(!!b.leftDate))
})

const menuOf = (member: PartyMember): RowMenuItem[] =>
	member.leftDate
		? [
				{
					label: 'Вернуть в пати',
					icon: 'rotate-ccw',
					select: () => store.restoreMember(member),
				},
			]
		: [
				{
					label: 'Изменить',
					icon: 'pencil',
					select: () => (editing.value = member),
				},
				{
					label: 'Удалить из пати',
					icon: 'trash-2',
					danger: true,
					select: () => (removing.value = member),
				},
			]

const colorField: FormField = {
	key: 'color',
	type: 'color',
	label: 'Цвет',
}

const fields = computed<FormField[]>(() => [
	{
		key: 'displayName',
		label: 'Имя в пати',
		placeholder: editing.value?.login,
	},
	{
		key: 'isAdmin',
		label: 'Админ пати',
		type: 'check',
	},
	colorField,
])

const initial = computed<FormValues>(() => ({
	displayName: editing.value?.displayName ?? '',
	isAdmin: editing.value?.isAdmin ?? false,
	color: editing.value?.color ?? '',
}))

const addFields = computed<FormField[]>(() => [
	{
		key: 'login',
		label: 'Логин',
		placeholder: 'Логин игрока',
		required: 'логин',
		error: addError.value,
	},
	colorField,
])

/** a new member gets the palette color that the current members use least */
const addInitial = computed<FormValues>(() => ({
	login: '',
	color: nextMemberColor(current.value.map((m) => m.color)),
}))

const openAdd = () => {
	addError.value = undefined
	isAdding.value = true
}

// the message is about the login that was typed, so a new text takes it away
const onAddChange = (values: FormValues) => {
	if (String(values.login).trim() !== refusedLogin) addError.value = undefined
}

/** the dialog takes `#ffb000` only */
const checkedColor = (value: FormValues[string]) => {
	const color = String(value).trim().toLowerCase()

	if (isMemberColor(color)) return color

	toastStore.show(
		'Проверь цвет',
		'Нужен вид #ffb000: решётка и шесть цифр.',
		'danger',
	)
}

const onAdd = async (values: FormValues) => {
	const login = String(values.login).trim()
	const color = checkedColor(values.color)

	if (!color) return

	const result = await store.addMember(login, color)

	refusedLogin = login

	if (result === 'added') {
		isAdding.value = false
	} else if (result === 'not-found') {
		addError.value = `Игрока ${login} нет. Проверь логин: он должен быть зарегистрирован.`
	} else if (result === 'already-member') {
		// the backend refuses a member who left as well
		addError.value = `${login} уже есть в списке. Если он вышел из пати, верни его в таблице.`
	}
}

const onSave = async (values: FormValues) => {
	const member = editing.value
	const color = checkedColor(values.color)

	if (!member || !color) return

	const ok = await store.updateMember(member, {
		displayName: String(values.displayName).trim() || null,
		isAdmin: values.isAdmin === true,
		color,
	})

	if (ok) editing.value = undefined
}

const onRemove = () => {
	const member = removing.value

	removing.value = undefined

	if (member) store.removeMember(member)
}

onMounted(() => store.loadMembers())
</script>

<template>
	<div class="members">
		<AdminListHeader
			v-model:query="query"
			title="Участники и права"
			placeholder="Найти участника…"
			@add="openAdd"
		>
			<UiChoiceChips
				v-model="filter"
				:options="filters"
				label="Кого показать"
			/>
		</AdminListHeader>

		<div class="table" role="table" aria-label="Участники пати">
			<div class="row row--head" role="row">
				<span role="columnheader">Участник</span>
				<span role="columnheader">Имя в пати</span>
				<span role="columnheader">В пати</span>
				<span role="columnheader">Роль</span>
			</div>

			<UiRowMenu
				v-for="member in rows"
				:key="member.login"
				class="row"
				:class="{ 'row--dead': member.leftDate }"
				role="row"
				label="Действия с участником"
				:items="menuOf(member)"
			>
				<div class="cell user" role="cell">
					<UiUserAvatar :name="member.login" :color="member.color" :size="28" />
					<span class="user__login">{{ member.login }}</span>
					<UiBadge v-if="member.login === sessionStore.login" tone="accent"
						>ты</UiBadge
					>
				</div>

				<div class="cell" role="cell">
					<span v-if="member.displayName" class="name">{{
						member.displayName
					}}</span>
					<span v-else class="name name--empty">Показывается логин</span>
				</div>

				<div class="cell dates" role="cell">
					<span>с {{ formatDate(member.joinedDate) }}</span>
					<span v-if="member.leftDate" class="dates__left"
						>вышел {{ formatDate(member.leftDate) }}</span
					>
				</div>

				<div class="cell" role="cell">
					<UiBadge tone="navy">{{
						member.isAdmin ? 'админ' : 'игрок'
					}}</UiBadge>
				</div>
			</UiRowMenu>

			<div v-if="!rows.length" class="table__empty">
				Таких участников нет. Нажми «Добавить», чтобы добавить игрока в пати.
			</div>
		</div>
	</div>

	<FormDialog
		:open="isAdding"
		title="Добавить участника"
		:sections="[{ fields: addFields }]"
		:initial="addInitial"
		submit-label="Добавить"
		@close="isAdding = false"
		@change="onAddChange"
		@save="onAdd"
	/>

	<FormDialog
		:open="!!editing"
		:title="editing?.login ?? ''"
		plain-title
		:sections="[{ fields }]"
		:initial
		@close="editing = undefined"
		@save="onSave"
	>
		<template v-if="editing" #lead>
			<UiUserAvatar :name="editing.login" :color="editing.color" :size="36" />
		</template>
	</FormDialog>

	<ConfirmDialog
		:open="!!removing"
		:title="removing ? `Удалить ${removing.login} из пати?` : ''"
		text="Игрок пропадёт из участников. Его записи в журнале останутся."
		ok-label="Удалить из пати"
		cancel-label="Оставить"
		@close="removing = undefined"
		@confirm="onRemove"
	/>
</template>

<style scoped>
.members {
	display: flex;
	flex-direction: column;
	gap: 16px;
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
	grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 150px 120px;
	gap: 16px;
	align-items: center;
	min-height: 56px;
	padding: 8px 60px 8px 20px;
	border-top: 1px solid var(--border-subtle);
}

.row--head {
	min-height: 0;
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

.row--dead .cell {
	opacity: 0.55;
}

.cell {
	min-width: 0;
}

.table__empty {
	padding: 16px 20px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}

.user {
	display: flex;
	align-items: center;
	gap: 10px;
}

.user__login {
	overflow: hidden;
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.name {
	font: var(--type-body);
	color: var(--text-strong);
}

.name--empty {
	color: var(--text-subtle);
}

.dates {
	display: flex;
	flex-direction: column;
	gap: 2px;
	font: var(--type-body-sm);
	color: var(--text-body);
}

.dates__left {
	font: var(--type-caption);
	color: var(--text-muted);
}
</style>

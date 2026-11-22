<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import type { Login, PartyMember } from '../../api-facade/contracts'
import ListBar from '../../components/ListBar.vue'
import ListHead from '../../components/ListHead.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import type { FormField, FormValues } from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiChoiceChips from '../../components/ui/UiChoiceChips.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiRowMenu, { type RowMenuItem } from '../../components/ui/UiRowMenu.vue'
import UiUserAvatar from '../../components/ui/UiUserAvatar.vue'
import { useParametersStore } from '../../stores/parametersStore'
import { useMembersStore } from '../../stores/membersStore'
import { useAdminSettingsStore } from '../../stores/adminSettingsStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useToastStore } from '../../stores/toastStore'
import { AVATAR_ACCEPT, avatarFileError } from '../../utils/avatar'
import { formatDate } from '../../utils/format'
import { nextMemberColor } from '../../utils/memberColor'

type Filter = 'all' | 'admins' | 'players' | 'left'

const store = useAdminSettingsStore()
const sessionStore = useSessionStore()
const membersStore = useMembersStore()
const parametersStore = useParametersStore()
const toastStore = useToastStore()

const editingLogin = ref<Login>()
const editing = computed(() =>
	store.members.find((member) => member.login === editingLogin.value),
)
const avatarInput = useTemplateRef<HTMLInputElement>('avatar-input')
const avatarError = ref<string>()
const avatarUpload = shallowRef<Promise<void>>()
const saving = ref(false)
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
					select: () => {
						avatarError.value = undefined
						editingLogin.value = member.login
					},
				},
				{
					label: 'Удалить из пати',
					icon: 'trash-2',
					danger: true,
					select: () => startRemove(member),
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
		...(editing.value?.login === sessionStore.login && {
			disabledReason: 'Снять админа с себя нельзя',
		}),
	},
	{
		...colorField,
		name: editing.value && membersStore.nameOf(editing.value.login),
		avatarUrl: editing.value?.avatarUrl,
	},
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

const onAdd = async (values: FormValues) => {
	const login = String(values.login).trim()
	const result = await store.addMember(login, String(values.color))

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

	if (!member || saving.value) return

	saving.value = true

	try {
		await avatarUpload.value

		const ok = await store.updateMember(member, {
			displayName: String(values.displayName).trim() || null,
			isAdmin: values.isAdmin === true,
			color: String(values.color),
		})

		if (ok && editingLogin.value === member.login)
			editingLogin.value = undefined
	} finally {
		saving.value = false
	}
}

const uploadAvatar = async (login: Login, file: File) => {
	const error = await avatarFileError(file)

	if (error) {
		if (editingLogin.value === login) avatarError.value = error
		return
	}

	await store.changeMemberAvatar(login, file)
}

const onAvatarFile = async (event: Event) => {
	const input = event.currentTarget as HTMLInputElement
	const file = input.files?.[0]
	const login = editingLogin.value
	input.value = ''

	if (!file || !login || avatarUpload.value || saving.value) return

	avatarError.value = undefined
	avatarUpload.value = uploadAvatar(login, file)

	try {
		await avatarUpload.value
	} finally {
		avatarUpload.value = undefined
	}
}

const removeText = ref('')

const REMOVE_TEXT =
	'Игрок пропадёт из участников. Его записи в журнале останутся.'

/** the backend makes the earliest joined member an admin when the last one leaves, unless the party turned it off */
const successionText = async (member: PartyMember) => {
	const others = current.value.filter((m) => m.login !== member.login)

	if (!member.isAdmin || !others.length || others.some((m) => m.isAdmin)) {
		return undefined
	}

	await parametersStore.load()

	const succession = parametersStore.parameters.find(
		(p) => p.code === 'AdminSuccessionEnabled',
	)

	if (succession?.value === 'false') return 'В пати не останется админа.'

	const heir = others.reduce((first, m) =>
		Date.parse(m.joinedDate) < Date.parse(first.joinedDate) ? m : first,
	)

	return `Админом станет ${membersStore.nameOf(heir.login)}.`
}

const startRemove = async (member: PartyMember) => {
	try {
		const succession = await successionText(member)

		removeText.value = succession ? `${REMOVE_TEXT} ${succession}` : REMOVE_TEXT
		removing.value = member
	} catch (e) {
		toastStore.error(e)
	}
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
		<ListHead title="Участники и права" @add="openAdd" />
		<ListBar v-model:query="query">
			<UiChoiceChips
				v-model="filter"
				:options="filters"
				label="Кого показать"
			/>
		</ListBar>

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
					<UiUserAvatar
						:name="membersStore.nameOf(member.login)"
						:color="member.color"
						:src="member.avatarUrl"
						:size="28"
					/>
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
		@close="editingLogin = undefined"
		@save="onSave"
	>
		<template v-if="editing" #lead>
			<button
				type="button"
				class="avatar-upload"
				:disabled="!!avatarUpload || saving"
				:aria-busy="!!avatarUpload"
				:aria-label="editing.avatarUrl ? 'Заменить аватар' : 'Загрузить аватар'"
				:aria-describedby="avatarError ? 'avatar-upload-error' : undefined"
				@click="avatarInput?.click()"
			>
				<UiUserAvatar
					:name="membersStore.nameOf(editing.login)"
					:color="editing.color"
					:src="editing.avatarUrl"
					:size="36"
				/>
				<span class="avatar-upload__overlay" aria-hidden="true">
					<span v-if="avatarUpload" class="avatar-upload__spinner"></span>
					<UiIcon v-else name="upload" :size="16" />
				</span>
			</button>
			<input
				ref="avatar-input"
				type="file"
				:accept="AVATAR_ACCEPT"
				hidden
				@change="onAvatarFile"
			/>
		</template>
		<template v-if="avatarError" #title-after>
			<span id="avatar-upload-error" class="avatar-upload__error" role="alert">
				{{ avatarError }}
			</span>
		</template>
	</FormDialog>

	<ConfirmDialog
		:open="!!removing"
		:title="
			removing ? `Удалить ${membersStore.nameOf(removing.login)} из пати?` : ''
		"
		:text="removeText"
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

.avatar-upload {
	position: relative;
	display: inline-flex;
	flex: none;
	padding: 0;
	border: 0;
	background: none;
	cursor: pointer;
}

.avatar-upload:focus-visible {
	box-shadow: var(--shadow-focus);
}

.avatar-upload:disabled {
	cursor: default;
}

.avatar-upload__overlay {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	clip-path: var(--hex-clip);
	background: var(--surface-overlay);
	color: var(--fgg-mist);
	opacity: 0;
}

.avatar-upload:not(:disabled):hover .avatar-upload__overlay,
.avatar-upload:focus-visible .avatar-upload__overlay,
.avatar-upload[aria-busy='true'] .avatar-upload__overlay {
	opacity: 1;
}

.avatar-upload__spinner {
	width: 16px;
	height: 16px;
	border: 2px solid currentColor;
	border-right-color: transparent;
	border-radius: 50%;
	animation: avatar-upload-spin 800ms linear infinite;
}

@keyframes avatar-upload-spin {
	to {
		transform: rotate(360deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.avatar-upload__spinner {
		animation: none;
	}
}

.avatar-upload__error {
	color: var(--danger);
	font: var(--type-body-sm);
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

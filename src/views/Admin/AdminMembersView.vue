<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { PartyMember } from '../../api-facade/contracts'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import type { FormField, FormValues } from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiUserAvatar from '../../components/ui/UiUserAvatar.vue'
import { useAdminSettingsStore } from '../../stores/adminSettingsStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useToastStore } from '../../stores/toastStore'
import { formatDate } from '../../utils/format'
import { isMemberColor, nextMemberColor } from '../../utils/memberColor'
import { plural } from '../../utils/plural'

/** `{}` adds a member, undefined means the dialog is closed */
type Dialog = { member?: PartyMember }

const store = useAdminSettingsStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

const dialog = ref<Dialog>()
const removing = ref<PartyMember>()

const query = ref('')

/** those who left stay in the list so that an admin can bring them back, they go last */
const found = computed(() => {
	const q = query.value.trim().toLowerCase()

	return store.members
		.filter(
			(m) =>
				!q ||
				m.login.toLowerCase().includes(q) ||
				m.displayName?.toLowerCase().includes(q),
		)
		.sort((a, b) => Number(!!a.leftDate) - Number(!!b.leftDate))
})

const currentCount = computed(
	() => store.members.filter((m) => !m.leftDate).length,
)

const count = computed(
	() =>
		`${currentCount.value} ${plural(currentCount.value, ['игрок', 'игрока', 'игроков'])}`,
)

const colorField: FormField = {
	key: 'color',
	type: 'color',
	label: 'Цвет',
	hint: 'Из палитры или свой в виде #ffb000. Цвета могут повторяться.',
}

const fields = computed<FormField[]>(() =>
	dialog.value?.member
		? [
				{
					key: 'displayName',
					label: 'Имя в пати',
					placeholder: dialog.value.member.login,
					hint: 'Пустое — показывается логин.',
				},
				{
					key: 'isAdmin',
					label: 'Админ пати',
					type: 'check',
					hint: 'Может менять каталоги, колесо, награды и участников.',
				},
				colorField,
			]
		: [
				{
					key: 'login',
					label: 'Логин',
					placeholder: 'dima',
					hint: 'Игрок должен быть зарегистрирован.',
				},
				colorField,
			],
)

/** a new member starts with the palette color that the current members use least */
const initial = computed<FormValues>(() => ({
	login: '',
	displayName: dialog.value?.member?.displayName ?? '',
	isAdmin: dialog.value?.member?.isAdmin ?? false,
	color:
		dialog.value?.member?.color ??
		nextMemberColor(
			store.members.filter((m) => !m.leftDate).map((m) => m.color),
		),
}))

const onSave = async (values: FormValues) => {
	const member = dialog.value?.member
	const color = String(values.color).trim().toLowerCase()

	if (!isMemberColor(color)) {
		toastStore.show(
			'Проверь цвет',
			'Нужен вид #ffb000: решётка и шесть цифр.',
			'danger',
		)
		return
	}

	if (!member) {
		const login = String(values.login).trim()

		if (!login) {
			toastStore.show('Впиши название', 'Без него не сохранится.', 'danger')
			return
		}

		if (await store.addMember(login, color)) dialog.value = undefined
		return
	}

	const ok = await store.updateMember(member, {
		displayName: String(values.displayName).trim() || null,
		isAdmin: values.isAdmin === true,
		color,
	})

	if (ok) dialog.value = undefined
}

const askRemove = (member: PartyMember) => {
	removing.value = member
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
		<div class="head">
			<UiPageTitle>Участники и права</UiPageTitle>
			<span class="head__count">{{ count }}</span>
			<div class="head__spacer"></div>
			<div class="head__search">
				<UiInput
					v-model="query"
					compact
					icon="search"
					placeholder="Найти…"
					aria-label="Поиск"
				/>
			</div>
			<UiButton icon="plus" @click="dialog = {}">Добавить</UiButton>
		</div>

		<div class="table">
			<div class="table__row table__row--head">
				<span>Логин</span>
				<span>Имя в пати</span>
				<span>В пати с</span>
				<span>Роль</span>
				<span></span>
			</div>

			<div
				v-for="member in found"
				:key="member.login"
				class="table__row table__row--body"
				:class="{ 'table__row--left': member.leftDate }"
			>
				<span class="user">
					<UiUserAvatar :name="member.login" :color="member.color" :size="28" />
					{{ member.login }}
					<UiBadge v-if="member.login === sessionStore.login" tone="accent"
						>ты</UiBadge
					>
					<UiBadge v-if="member.leftDate" tone="neutral">
						вышел {{ formatDate(member.leftDate) }}
					</UiBadge>
				</span>

				<span class="name" :class="{ 'name--empty': !member.displayName }">
					{{ member.displayName || member.login }}
				</span>

				<span class="joined">{{ formatDate(member.joinedDate) }}</span>

				<span class="role">
					<UiBadge tone="navy">{{
						member.isAdmin ? 'админ' : 'игрок'
					}}</UiBadge>
				</span>

				<span class="table__actions">
					<UiIconButton
						v-if="member.leftDate"
						icon="rotate-ccw"
						size="sm"
						label="Вернуть в пати"
						@click="store.restoreMember(member)"
					/>
					<template v-else>
						<UiIconButton
							icon="pencil"
							size="sm"
							label="Изменить"
							@click="dialog = { member }"
						/>
						<UiIconButton
							icon="trash-2"
							size="sm"
							label="Удалить из пати"
							@click="askRemove(member)"
						/>
					</template>
				</span>
			</div>
		</div>

		<span class="note">
			Пустое имя — показывается логин. Снять админа с себя нельзя. Если из пати
			уходит последний админ, им становится тот, кто вступил раньше всех.
		</span>
	</div>

	<FormDialog
		:open="!!dialog"
		:title="
			dialog?.member
				? `Участник · ${dialog.member.login}`
				: 'Добавить участника'
		"
		:sections="[{ fields }]"
		:initial
		@close="dialog = undefined"
		@save="onSave"
	/>

	<ConfirmDialog
		:open="!!removing"
		:title="removing ? `Удалить ${removing.login} из пати?` : ''"
		text="Игрок пропадёт из участников. Записи в журнале останутся."
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

.head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.head__count {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.head__spacer {
	flex: 1;
}

.head__search {
	width: 260px;
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
	grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.5fr) 120px 72px 76px;
	gap: 12px;
	align-items: center;
}

.table__row--head {
	padding: 12px 16px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__row--body {
	min-height: 52px;
	padding: 6px 16px;
	border-top: 1px solid var(--border-subtle);
}

.table__row--left {
	opacity: 0.6;
}

.table__actions {
	display: flex;
	gap: 4px;
	justify-content: flex-end;
}

.user {
	display: flex;
	align-items: center;
	gap: 10px;
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.name {
	font: var(--type-body);
	color: var(--text-body);
}

.name--empty {
	color: var(--text-subtle);
}

.joined {
	font: var(--type-mono);
	color: var(--text-muted);
}

.role {
	display: flex;
}

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
}
</style>

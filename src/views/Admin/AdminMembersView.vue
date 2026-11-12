<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { PartyMember } from '../../api-facade/contracts'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import type { FormField, FormValues } from '../../components/formDialog'
import FormDialog from '../../components/FormDialog.vue'
import InlineAddRow from '../../components/InlineAddRow.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiUserAvatar from '../../components/ui/UiUserAvatar.vue'
import { useAdminSettingsStore } from '../../stores/adminSettingsStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useToastStore } from '../../stores/toastStore'
import { formatDate } from '../../utils/format'
import { isMemberColor, nextMemberColor } from '../../utils/memberColor'
import { plural } from '../../utils/plural'

const store = useAdminSettingsStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

/** the member in the edit dialog, undefined means the dialog is closed */
const editing = ref<PartyMember>()
const removing = ref<PartyMember>()

/** one field: the text filters the table and is the login that «Добавить» adds */
const query = ref('')
const addError = ref<string>()

// the message is about the login that was typed, so a new text takes it away
watch(query, () => (addError.value = undefined))

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

const fields = computed<FormField[]>(() => [
	{
		key: 'displayName',
		label: 'Имя в пати',
		placeholder: editing.value?.login,
		hint: 'Пустое — покажем логин.',
	},
	{
		key: 'isAdmin',
		label: 'Админ пати',
		type: 'check',
		hint: 'Меняет каталоги, колесо, награды и участников.',
	},
	colorField,
])

const initial = computed<FormValues>(() => ({
	displayName: editing.value?.displayName ?? '',
	isAdmin: editing.value?.isAdmin ?? false,
	color: editing.value?.color ?? '',
}))

/** a new member gets the palette color that the current members use least, and it is changed in the edit dialog */
const onAdd = async (login: string) => {
	const result = await store.addMember(
		login,
		nextMemberColor(
			store.members.filter((m) => !m.leftDate).map((m) => m.color),
		),
	)

	if (result === 'added') {
		query.value = ''
	} else if (result === 'not-found') {
		addError.value = `Игрока ${login} нет. Проверь логин: он должен быть зарегистрирован.`
	} else if (result === 'already-member') {
		// the backend refuses a member who left as well
		addError.value = `${login} уже есть в списке. Если он вышел из пати, верни его в таблице.`
	}
}

const onSave = async (values: FormValues) => {
	const member = editing.value
	const color = String(values.color).trim().toLowerCase()

	if (!member) return

	if (!isMemberColor(color)) {
		toastStore.show(
			'Проверь цвет',
			'Нужен вид #ffb000: решётка и шесть цифр.',
			'danger',
		)
		return
	}

	const ok = await store.updateMember(member, {
		displayName: String(values.displayName).trim() || null,
		isAdmin: values.isAdmin === true,
		color,
	})

	if (ok) editing.value = undefined
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
		</div>

		<InlineAddRow
			v-model="query"
			icon="search"
			placeholder="Логин игрока…"
			label="Логин игрока: поиск и добавление"
			:error="addError"
			@submit="onAdd"
		/>

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
							@click="editing = member"
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

			<div v-if="!found.length" class="table__empty">
				Такого игрока в списке нет. Нажми «Добавить», чтобы добавить его в пати.
			</div>
		</div>

		<span class="note">
			Пустое имя — показывается логин. Снять админа с себя нельзя. Если из пати
			уходит последний админ, им становится тот, кто вступил раньше всех.
		</span>
	</div>

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

.head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.head__count {
	font: var(--type-body-sm);
	color: var(--text-muted);
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

.table__empty {
	padding: 16px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
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

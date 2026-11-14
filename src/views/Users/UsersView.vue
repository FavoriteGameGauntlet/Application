<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Member, UserStatus } from '../../api-facade/contracts'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiChoiceChips from '../../components/ui/UiChoiceChips.vue'
import UiIcon from '../../components/ui/UiIcon.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiRowMenu, { type RowMenuItem } from '../../components/ui/UiRowMenu.vue'
import UiUserAvatar from '../../components/ui/UiUserAvatar.vue'
import { RouteName } from '../../router/routeNames'
import { useMembersStore } from '../../stores/membersStore'
import { useSessionStore } from '../../stores/sessionStore'
import { userStatusView } from '../../utils/userStatus'
import { formatDuration } from '../../utils/format'
import { plural } from '../../utils/plural'

type StatusFilter = UserStatus | 'all'

const router = useRouter()
const membersStore = useMembersStore()
const sessionStore = useSessionStore()

const query = ref('')
const status = ref<StatusFilter>('all')

const members = computed(() =>
	[...membersStore.list].sort((a, b) => b.playedSeconds - a.playedSeconds),
)

/** the bar of the leader is full */
const maxPlayed = computed(() => members.value[0]?.playedSeconds ?? 0)

const count = computed(
	() =>
		`${members.value.length} ${plural(members.value.length, ['игрок', 'игрока', 'игроков'])}`,
)

const chipLabels: Record<StatusFilter, string> = {
	all: 'Все',
	playing: 'Играют',
	paused: 'На паузе',
	offline: 'Не в сети',
}

const chips = computed(() =>
	(Object.keys(chipLabels) as StatusFilter[]).map((value) => ({
		value,
		label: chipLabels[value],
		count:
			value === 'all'
				? members.value.length
				: members.value.filter((m) => m.status === value).length,
	})),
)

const rows = computed(() => {
	const q = query.value.trim().toLowerCase()
	return members.value.filter(
		(m) =>
			(status.value === 'all' || m.status === status.value) &&
			(!q ||
				m.user.login.toLowerCase().includes(q) ||
				m.displayName?.toLowerCase().includes(q)),
	)
})

const share = (m: Member) =>
	maxPlayed.value ? `${(m.playedSeconds / maxPlayed.value) * 100}%` : '0'

function openProfile(m: Member) {
	router.push({ name: RouteName.UserDetail, params: { login: m.user.login } })
}

const menuOf = (m: Member): RowMenuItem[] => [
	{ label: 'Открыть профиль', icon: 'user', select: () => openProfile(m) },
]

onMounted(() => membersStore.load())
</script>

<template>
	<div class="users">
		<div class="head">
			<UiPageTitle>Участники</UiPageTitle>
			<span class="head__count">{{ count }}</span>
		</div>

		<div class="bar">
			<div class="bar__search">
				<UiInput
					v-model="query"
					compact
					icon="search"
					placeholder="Найти игрока…"
					aria-label="Поиск по игрокам"
				/>
			</div>
			<UiChoiceChips
				:model-value="status"
				:options="chips"
				label="Статус"
				@update:model-value="status = $event as StatusFilter"
			/>
			<span class="bar__note">Сортировка: по времени игры</span>
		</div>

		<div class="table" role="table" aria-label="Участники пати">
			<div class="row row--head" role="row">
				<span role="columnheader">Игрок</span>
				<span role="columnheader">Статус</span>
				<span role="columnheader">Текущая игра</span>
				<span role="columnheader">Сыграно ↓</span>
				<span role="columnheader" class="right">Пройдено</span>
				<span role="columnheader" class="right">Прокруты</span>
				<span></span>
			</div>

			<UiRowMenu
				v-for="member in rows"
				:key="member.user.login"
				class="row row--body"
				:class="{ 'row--me': member.user.login === sessionStore.login }"
				role="row"
				label="Действия с игроком"
				:items="menuOf(member)"
				@click="openProfile(member)"
			>
				<span class="user" role="cell">
					<UiUserAvatar
						:name="member.user.login"
						:color="member.user.color"
						:size="28"
					/>
					<span class="user__text">
						<span class="user__line">
							<span class="user__name">{{
								member.displayName ?? member.user.login
							}}</span>
							<UiBadge
								v-if="member.user.login === sessionStore.login"
								tone="accent"
								>ты</UiBadge
							>
						</span>
						<span v-if="member.displayName" class="user__login">{{
							member.user.login
						}}</span>
					</span>
				</span>
				<span class="status" role="cell">
					<UiBadge :tone="userStatusView[member.status].tone" dot>
						{{ userStatusView[member.status].label }}
					</UiBadge>
				</span>
				<span
					class="game"
					:class="{ 'game--none': !member.currentGame }"
					role="cell"
				>
					{{ member.currentGame ?? 'нет игры' }}
				</span>
				<span class="played" role="cell">
					<span class="num">{{ formatDuration(member.playedSeconds) }}</span>
					<span class="meter"
						><i class="meter__fill" :style="{ width: share(member) }"></i
					></span>
				</span>
				<span class="num right" role="cell">{{ member.completedCount }}</span>
				<span class="num right" role="cell">{{ member.spinsCount }}</span>
				<span class="chevron" role="cell">
					<UiIcon name="chevron-right" :size="18" />
				</span>
			</UiRowMenu>

			<div v-if="!rows.length" class="empty">
				{{ members.length ? 'Никого не нашлось.' : 'В пати пока нет игроков.' }}
			</div>
		</div>
	</div>
</template>

<style scoped>
.users {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.head {
	display: flex;
	align-items: center;
	gap: 16px;
}

.head__count {
	font: 500 14px / 1 var(--font-mono);
	color: var(--text-muted);
}

.bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
}

.bar__search {
	width: 260px;
}

.bar__note {
	margin-left: auto;
	font: var(--type-caption);
	color: var(--text-muted);
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.row {
	display: grid;
	grid-template-columns:
		minmax(0, 1.5fr) 116px minmax(0, 1.2fr) minmax(0, 1.3fr)
		84px 84px 20px;
	gap: 16px;
	align-items: center;
	box-sizing: border-box;
	padding: 12px 60px 12px 20px;
}

.row--head {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	white-space: nowrap;
	background: var(--surface-sunken);
}

.row--body {
	min-height: 64px;
	border-top: 1px solid var(--border-subtle);
	cursor: pointer;
}

.row--body:not(.row--me):hover {
	background: var(--surface-sunken);
}

.row--me {
	background: var(--accent-soft);
}

.row--me::before {
	content: '';
	position: absolute;
	top: 16px;
	bottom: 16px;
	left: 0;
	width: 3px;
	border-radius: 2px;
	background: var(--accent);
}

.right {
	text-align: right;
}

.user {
	display: flex;
	align-items: center;
	gap: 10px;
	min-width: 0;
}

.user__text {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
}

.user__line {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.user__name {
	overflow: hidden;
	font: 600 15px / 1.35 var(--font-body);
	color: var(--text-strong);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.user__login {
	overflow: hidden;
	font: var(--type-caption);
	color: var(--text-muted);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.status {
	display: flex;
}

.game {
	overflow: hidden;
	font: 600 15px / 1.35 var(--font-body);
	color: var(--text-strong);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.game--none {
	font-weight: 400;
	color: var(--text-muted);
}

.played {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.num {
	font: 500 14px / 1.2 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.meter {
	display: block;
	height: 6px;
	overflow: hidden;
	background: var(--border-subtle);
	border-radius: 3px;
}

.meter__fill {
	display: block;
	height: 100%;
	background: var(--accent);
	border-radius: 3px;
}

.chevron {
	display: flex;
	color: var(--text-muted);
}

.empty {
	padding: 20px;
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>

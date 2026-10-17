<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiUserAvatar from '../../components/ui/UiUserAvatar.vue'
import { RouteName } from '../../router/routeNames'
import { useMembersStore } from '../../stores/membersStore'
import { useSessionStore } from '../../stores/sessionStore'
import { userStatusView } from '../../utils/userStatus'
import { formatHours } from '../../utils/format'
import { plural } from '../../utils/plural'

const router = useRouter()
const membersStore = useMembersStore()
const sessionStore = useSessionStore()

const members = computed(() =>
	[...membersStore.list].sort((a, b) => b.playedSeconds - a.playedSeconds),
)

const count = computed(
	() =>
		`${members.value.length} ${plural(members.value.length, ['игрок', 'игрока', 'игроков'])}`,
)

onMounted(() => membersStore.load())
</script>

<template>
	<div class="users">
		<div class="head">
			<UiPageTitle>Участники</UiPageTitle>
			<span class="head__count">{{ count }}</span>
		</div>

		<div class="table">
			<div class="table__row table__row--head">
				<span>Игрок</span>
				<span>Статус</span>
				<span class="table__cut">Текущая игра</span>
				<span class="table__right">Сыграно ↓</span>
				<span class="table__right">Пройдено</span>
				<span class="table__right">Прокруты</span>
			</div>

			<div
				v-for="member in members"
				:key="member.user.login"
				class="table__row table__row--body"
				:class="{ 'table__row--me': member.user.login === sessionStore.login }"
				@click="router.push({ name: RouteName.UserDetail, params: { login: member.user.login } })"
			>
				<span class="user">
					<UiUserAvatar
						:name="member.user.login"
						:color="`var(--user-${member.user.colorIndex})`"
						:size="28"
					/>
					{{ member.user.login }}
					<UiBadge v-if="member.user.login === sessionStore.login" tone="accent">ты</UiBadge>
				</span>
				<span class="table__status">
					<UiBadge :tone="userStatusView[member.status].tone" dot>
						{{ userStatusView[member.status].label }}
					</UiBadge>
				</span>
				<span class="table__game" :class="{ 'table__game--none': !member.currentGame }">
					{{ member.currentGame ?? 'нет игры' }}
				</span>
				<span class="table__num">{{ formatHours(member.playedSeconds) }}</span>
				<span class="table__num">{{ member.completedCount }}</span>
				<span class="table__num">{{ member.spinsCount }}</span>
			</div>
		</div>

		<span class="note">
			Очки, предметы и эффекты — в профиле игрока. Нажми на строку, чтобы его открыть.
		</span>
	</div>
</template>

<style scoped>
.users {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.head {
	display: flex;
	align-items: baseline;
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
	grid-template-columns: minmax(120px, 1fr) 120px minmax(120px, 1.2fr) 76px 76px 76px;
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

.table__row--head span {
	white-space: nowrap;
}

.table__cut {
	overflow: hidden;
	text-overflow: ellipsis;
}

.table__right,
.table__num {
	text-align: right;
}

.table__row--body {
	min-height: 52px;
	padding: 6px 16px;
	border-top: 1px solid var(--border-subtle);
	cursor: pointer;
}

.table__row--me {
	background: var(--accent-soft);
}

.table__row--body:hover {
	background: var(--surface-sunken);
}

.user {
	display: flex;
	align-items: center;
	gap: 10px;
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.table__status {
	display: flex;
}

.table__game {
	overflow: hidden;
	font: var(--type-body-sm);
	color: var(--text-body);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.table__game--none {
	color: var(--text-subtle);
}

.table__num {
	font: 600 15px / 1.45 var(--font-display);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Login, PointsStanding } from '../../../api-facade/contracts'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiRowMenu, {
	type RowMenuItem,
} from '../../../components/ui/UiRowMenu.vue'
import UiUserAvatar from '../../../components/ui/UiUserAvatar.vue'
import { RouteName } from '../../../router/routeNames'
import { useJournalStore } from '../../../stores/journalStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { formatBounds } from '../../../utils/format'

const router = useRouter()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()
const journalStore = useJournalStore()

const query = ref('')
const selectedType = ref<number | undefined>(
	resourcesStore.personalTypes[0]?.id,
)

const selected = computed(() =>
	resourcesStore.personalTypes.find((t) => t.id === selectedType.value),
)

const types = computed(() => {
	const q = query.value.trim().toLowerCase()

	return resourcesStore.personalTypes.filter(
		(t) => !q || t.name.toLowerCase().includes(q),
	)
})

const valueOf = (standing: PointsStanding, typeId: number) =>
	standing.points[typeId] ?? 0

/** equal values share a place: 1, 2, 2, 4 */
const rankingOf = (typeId: number) => {
	const sorted = [...resourcesStore.standings].sort(
		(a, b) => valueOf(b, typeId) - valueOf(a, typeId),
	)

	return sorted.map((standing) => ({
		standing,
		value: valueOf(standing, typeId),
		place:
			sorted.findIndex(
				(s) => valueOf(s, typeId) === valueOf(standing, typeId),
			) + 1,
	}))
}

const placeOf = (login: Login, typeId: number) =>
	rankingOf(typeId).find((r) => r.standing.user.login === login)?.place

const myStanding = computed(() =>
	resourcesStore.standings.find((s) => s.user.login === sessionStore.login),
)

const myValue = (typeId: number) =>
	myStanding.value ? valueOf(myStanding.value, typeId) : 0

const formatValue = (n: number) =>
	`${n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('ru-RU')}`

const formatDiff = (n: number) =>
	n > 0 ? `+${formatValue(n)}` : n < 0 ? formatValue(n) : '—'

const placeText = (place: number | undefined) =>
	place === undefined ? '' : `${place}-е место`

const sideTypes = computed(() =>
	types.value.map((type) => ({
		type,
		value: formatValue(myValue(type.id)),
		place: placeText(placeOf(sessionStore.login, type.id)),
	})),
)

const rows = computed(() => {
	const type = selected.value
	if (!type) return []

	const ranking = rankingOf(type.id)
	const leader = Math.max(ranking[0]?.value ?? 0, 0)
	const mine = myValue(type.id)

	return ranking.map((r) => ({
		...r,
		share: leader ? `${(Math.max(r.value, 0) / leader) * 100}%` : '0',
		diff: r.value - mine,
		isMe: r.standing.user.login === sessionStore.login,
	}))
})

const bounds = computed(() =>
	selected.value &&
	(selected.value.minimum !== null || selected.value.maximum !== null)
		? `Граница: ${formatBounds(selected.value.minimum, selected.value.maximum)}`
		: undefined,
)

function openProfile(login: Login) {
	router.push({ name: RouteName.UserDetail, params: { login } })
}

const menuOf = (login: Login): RowMenuItem[] => [
	{ label: 'Открыть профиль', icon: 'user', select: () => openProfile(login) },
]

watch(() => journalStore.revision, resourcesStore.loadStandings, {
	immediate: true,
})
</script>

<template>
	<div class="points">
		<div class="panel">
			<span class="label panel__label">Типы очков</span>
			<UiInput
				v-model="query"
				placeholder="Найти тип…"
				icon="search"
				aria-label="Поиск по типам очков"
			/>

			<div class="types">
				<button
					v-for="item in sideTypes"
					:key="item.type.id"
					class="type"
					:class="{ 'type--on': item.type.id === selectedType }"
					type="button"
					@click="selectedType = item.type.id"
				>
					<span class="type__text">
						<span class="type__name" :title="item.type.name">{{
							item.type.name
						}}</span>
						<span v-if="item.place" class="type__place">{{ item.place }}</span>
					</span>
					<span class="type__value">{{ item.value }}</span>
				</button>

				<div v-if="!sideTypes.length" class="type__empty">
					{{
						resourcesStore.personalTypes.length
							? 'Ничего не нашлось.'
							: 'Типов очков пока нет.'
					}}
				</div>
			</div>
		</div>

		<div v-if="selected" class="main">
			<div class="head">
				<div class="head__title">
					<span class="label">Рейтинг по очкам</span>
					<span class="head__name" :title="selected.name">{{
						selected.name
					}}</span>
				</div>
				<span v-if="bounds" class="fact">{{ bounds }}</span>
			</div>

			<div
				class="table"
				role="table"
				:aria-label="`Рейтинг по типу «${selected.name}»`"
			>
				<div class="row row--head" role="row">
					<span role="columnheader">№</span>
					<span role="columnheader">Игрок</span>
					<span role="columnheader">Доля от лидера</span>
					<span role="columnheader" class="right">Значение ↓</span>
					<span role="columnheader" class="right">Разница со мной</span>
				</div>

				<UiRowMenu
					v-for="row in rows"
					:key="row.standing.user.login"
					class="row row--body"
					:class="{ 'row--me': row.isMe }"
					role="row"
					label="Действия с игроком"
					:items="menuOf(row.standing.user.login)"
					@click="openProfile(row.standing.user.login)"
				>
					<span class="num num--muted" role="cell">{{ row.place }}</span>
					<span class="user" role="cell">
						<UiUserAvatar
							:name="row.standing.user.login"
							:color="row.standing.user.color"
							:size="28"
						/>
						<span class="user__name">{{ row.standing.user.login }}</span>
						<UiBadge v-if="row.isMe" tone="accent">ты</UiBadge>
					</span>
					<span class="meter" role="cell"
						><i class="meter__fill" :style="{ width: row.share }"></i
					></span>
					<span class="num num--value right" role="cell">{{
						formatValue(row.value)
					}}</span>
					<span
						class="num right"
						:class="{
							'num--gain': row.diff > 0,
							'num--loss': row.diff < 0,
							'num--muted': row.diff === 0,
						}"
						role="cell"
						>{{ formatDiff(row.diff) }}</span
					>
				</UiRowMenu>

				<div v-if="!rows.length" class="empty">В пати пока нет игроков.</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.points {
	display: grid;
	grid-template-columns: 280px minmax(0, 1fr);
	gap: 20px;
	align-items: start;
}

.panel {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.panel__label {
	padding: 4px 12px 8px;
}

.types {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.type {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 12px;
	font: inherit;
	text-align: left;
	color: var(--text-strong);
	background: none;
	border: none;
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.type:hover,
.type--on {
	background: var(--surface-sunken);
}

.type__text {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.type__name {
	overflow: hidden;
	font: 600 15px / 1.35 var(--font-body);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.type__place {
	font: var(--type-caption);
	color: var(--text-muted);
}

.type__value {
	flex-shrink: 0;
	font: 600 14px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-muted);
}

.type--on .type__value {
	color: var(--text-strong);
}

.type__empty {
	padding: 8px 12px;
	color: var(--text-muted);
}

.main {
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
}

.head {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	gap: 16px;
}

.head__title {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.head__name {
	overflow: hidden;
	font: 700 24px / 1.2 var(--font-body);
	color: var(--text-strong);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.fact {
	padding: 6px 10px;
	font: 500 13px / 1 var(--font-mono);
	color: var(--text-muted);
	white-space: nowrap;
	background: var(--surface-sunken);
	border-radius: var(--radius-sm);
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
	grid-template-columns: 44px minmax(0, 1.4fr) minmax(0, 1.3fr) 96px 140px;
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
	min-height: 56px;
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
	top: 14px;
	bottom: 14px;
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

.user__name {
	overflow: hidden;
	font: 600 15px / 1.35 var(--font-body);
	color: var(--text-strong);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.num {
	font: 500 14px / 1.2 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.num--value {
	font-size: 16px;
}

.num--muted {
	color: var(--text-muted);
}

.num--gain {
	color: var(--success-text);
}

.num--loss {
	color: var(--danger-text);
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

.empty {
	padding: 20px;
	color: var(--text-muted);
	border-top: 1px solid var(--border-subtle);
}
</style>

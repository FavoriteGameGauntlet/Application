<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { JournalEntry, Member } from '../../api-facade/contracts'
import EventFeed from '../../components/EventFeed.vue'
import ResourceTiles from '../../components/ResourceTiles.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiPlayerAvatar from '../../components/ui/UiPlayerAvatar.vue'
import { RouteName } from '../../router/routeNames'
import { useJournalStore } from '../../stores/journalStore'
import { useMembersStore } from '../../stores/membersStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { formatHours } from '../../utils/format'
import { playerStatusView } from '../../utils/playerStatus'

const PROFILE_EVENTS_COUNT = 5

const route = useRoute()
const journalStore = useJournalStore()
const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()

const login = computed(() => route.params.login as string)
const color = computed(() => membersStore.colorOf(login.value))

const member = ref<Member>()
const feed = ref<JournalEntry[]>([])

watch(
	login,
	async () => {
		member.value = undefined

		const [loaded] = await Promise.all([
			membersStore.get(login.value),
			resourcesStore.loadPlayer(login.value),
		])

		member.value = loaded
	},
	{ immediate: true },
)

watch(
	[login, () => journalStore.revision],
	async () => {
		feed.value = await journalStore.fetch({
			player: login.value,
			limit: PROFILE_EVENTS_COUNT,
		})
	},
	{ immediate: true },
)

const stats = computed(() => [
	{ label: 'Сыграно', value: formatHours(member.value?.playedSeconds ?? 0) },
	{ label: 'Пройдено', value: member.value?.completedCount ?? 0 },
	{ label: 'Прокруты', value: member.value?.spinsCount ?? 0 },
])
</script>

<template>
	<div class="profile">
		<div class="breadcrumbs">
			<RouterLink :to="{ name: RouteName.Users }">Участники</RouterLink>
			<span>/</span>
			<span class="breadcrumbs__current">{{ login }}</span>
		</div>

		<div v-if="member" class="header">
			<span class="header__accent" :style="{ background: color }"></span>

			<UiPlayerAvatar :name="login" :color="color" :size="48" />

			<div class="header__info">
				<span class="header__name-row">
					<span class="header__name">{{ login }}</span>
					<UiBadge :tone="playerStatusView[member.status].tone" dot>
						{{ playerStatusView[member.status].label }}
					</UiBadge>
				</span>
				<span class="header__now">
					Сейчас:
					<span class="header__game">{{ member.currentGame ?? 'нет игры' }}</span>
				</span>
			</div>

			<div class="stats">
				<div v-for="stat in stats" :key="stat.label" class="stat">
					<span class="stat__label">{{ stat.label }}</span>
					<span class="stat__value">{{ stat.value }}</span>
				</div>
			</div>
		</div>

		<div class="grid">
			<ResourceTiles :resources="resourcesStore.byPlayer[login]" />

			<EventFeed
				title="История игрока"
				link-label="В журнале"
				:link-to="{
					name: RouteName.Resources,
					params: { tab: 'history' },
					query: { player: login },
				}"
				:entries="feed"
				:dot-color="color"
				empty-text="За неделю ничего не происходило."
			/>
		</div>
	</div>
</template>

<style scoped>
.profile {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 20px;
}

.breadcrumbs {
	display: flex;
	align-items: center;
	gap: 8px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.breadcrumbs__current {
	color: var(--text-strong);
}

.header {
	position: relative;
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px 20px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.header__accent {
	position: absolute;
	top: 0;
	left: 20px;
	width: 40px;
	height: 4px;
	border-radius: 0 0 2px 2px;
}

.header__info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.header__name-row {
	display: flex;
	align-items: center;
	gap: 10px;
}

.header__name {
	font: var(--type-h3);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.header__now {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.header__game {
	font-weight: 600;
	color: var(--text-strong);
}

.stats {
	display: flex;
	gap: 28px;
}

.stat {
	display: flex;
	flex-direction: column;
	gap: 4px;
	align-items: flex-end;
}

.stat__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.stat__value {
	font: 800 22px / 1 var(--font-display);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}

.grid {
	display: grid;
	flex: 1;
	grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
	gap: 20px;
}
</style>

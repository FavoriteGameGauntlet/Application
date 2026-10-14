<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiPlayerAvatar from '../../../components/ui/UiPlayerAvatar.vue'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'

const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const query = ref('')
const selectedType = ref<number | undefined>(resourcesStore.pointTypes[0]?.id)

const selectedName = computed(
	() => resourcesStore.pointTypes.find((t) => t.id === selectedType.value)?.name,
)

const myPoints = computed(() => resourcesStore.byPlayer[sessionStore.login]?.points ?? {})

const types = computed(() => {
	const q = query.value.trim().toLowerCase()

	return resourcesStore.pointTypes.filter((t) => !q || t.name.toLowerCase().includes(q))
})

const rows = computed(() =>
	selectedType.value === undefined
		? []
		: (resourcesStore.leaderboards[selectedType.value]?.rows ?? []),
)

watch(
	selectedType,
	(type) => {
		if (type !== undefined) resourcesStore.loadLeaderboard(type)
	},
	{ immediate: true },
)
</script>

<template>
	<div class="points">
		<div class="panel">
			<span class="label">Типы очков</span>
			<UiInput v-model="query" placeholder="Найти тип…" icon="search" />

			<div class="types">
				<div
					v-for="type in types"
					:key="type.id"
					class="type"
					:class="{ 'type--on': type.id === selectedType }"
					@click="selectedType = type.id"
				>
					<span>{{ type.name }}</span>
					<span class="type__value">{{ myPoints[type.id] ?? 0 }}</span>
				</div>
			</div>

			<span class="panel__hint">Справа — твоё значение</span>
		</div>

		<div class="table">
			<div class="table__row table__row--head">
				<span>Игрок</span>
				<span class="table__right">{{ selectedName }} ↓</span>
			</div>

			<div
				v-for="row in rows"
				:key="row.player.login"
				class="table__row table__row--body"
				:class="{ 'table__row--me': row.player.login === sessionStore.login }"
			>
				<span class="player">
					<UiPlayerAvatar
						:name="row.player.login"
						:color="`var(--player-${row.player.colorIndex})`"
						:size="28"
					/>
					{{ row.player.login }}
					<UiBadge v-if="row.player.login === sessionStore.login" tone="accent">ты</UiBadge>
				</span>
				<span class="table__value">{{ row.value }}</span>
			</div>
		</div>
	</div>
</template>

<style scoped>
.points {
	display: grid;
	grid-template-columns: 240px minmax(0, 1fr);
	gap: 20px;
	align-items: start;
}

.panel {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
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

.types {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.type {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	height: 36px;
	padding: 0 10px;
	font: var(--type-body-sm);
	color: var(--text-strong);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.type:hover,
.type--on {
	background: var(--surface-sunken);
}

.type--on {
	font-weight: 600;
}

.type__value {
	font: 600 13px / 1 var(--font-mono);
	color: var(--text-muted);
}

.panel__hint {
	font: var(--type-caption);
	color: var(--text-subtle);
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
	grid-template-columns: minmax(0, 1fr) 140px;
	gap: 16px;
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

.table__right {
	text-align: right;
}

.table__row--body {
	min-height: 48px;
	padding: 6px 16px;
	border-top: 1px solid var(--border-subtle);
}

.table__row--me {
	background: var(--accent-soft);
}

.player {
	display: flex;
	align-items: center;
	gap: 10px;
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.table__value {
	text-align: right;
	font: 700 15px / 1 var(--font-mono);
	font-variant-numeric: tabular-nums;
	color: var(--text-strong);
}
</style>

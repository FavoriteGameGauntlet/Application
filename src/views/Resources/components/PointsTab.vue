<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiUserAvatar from '../../../components/ui/UiUserAvatar.vue'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'

const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const query = ref('')
const selectedType = ref<number | undefined>(
	resourcesStore.personalTypes[0]?.id,
)

const selectedName = computed(
	() =>
		resourcesStore.personalTypes.find((t) => t.id === selectedType.value)?.name,
)

const myPoints = computed(
	() => resourcesStore.byUser[sessionStore.login]?.points ?? {},
)

const types = computed(() => {
	const q = query.value.trim().toLowerCase()

	return resourcesStore.personalTypes.filter(
		(t) => !q || t.name.toLowerCase().includes(q),
	)
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
					<span class="type__name" :title="type.name">{{ type.name }}</span>
					<span class="type__value">{{ myPoints[type.id] ?? 0 }}</span>
				</div>
			</div>
		</div>

		<div class="table">
			<div class="table__row table__row--head">
				<span>Игрок</span>
				<span class="table__right table__sort">
					<span class="table__name" :title="selectedName">{{
						selectedName
					}}</span>
					<span>↓</span>
				</span>
			</div>

			<div
				v-for="row in rows"
				:key="row.user.login"
				class="table__row table__row--body"
				:class="{ 'table__row--me': row.user.login === sessionStore.login }"
			>
				<span class="user">
					<UiUserAvatar
						:name="row.user.login"
						:color="row.user.color"
						:size="28"
					/>
					{{ row.user.login }}
					<UiBadge v-if="row.user.login === sessionStore.login" tone="accent"
						>ты</UiBadge
					>
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

.type__name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.type__value {
	flex-shrink: 0;
	font: 600 13px / 1 var(--font-mono);
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

.table__sort {
	display: flex;
	justify-content: flex-end;
	gap: 4px;
	min-width: 0;
}

.table__name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.table__row--body {
	min-height: 48px;
	padding: 6px 16px;
	border-top: 1px solid var(--border-subtle);
}

.table__row--me {
	background: var(--accent-soft);
}

.user {
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

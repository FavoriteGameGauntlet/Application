<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiIcon from '../../../components/ui/UiIcon.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiUserAvatar from '../../../components/ui/UiUserAvatar.vue'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { formatBounds } from '../../../utils/format'

const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const query = ref('')
const selectedType = ref<number | undefined>(resourcesStore.personalTypes[0]?.id)

const selectedName = computed(
	() => resourcesStore.personalTypes.find((t) => t.id === selectedType.value)?.name,
)

const myPoints = computed(() => resourcesStore.byUser[sessionStore.login]?.points ?? {})

const types = computed(() => {
	const q = query.value.trim().toLowerCase()

	return resourcesStore.personalTypes.filter((t) => !q || t.name.toLowerCase().includes(q))
})

const rows = computed(() =>
	selectedType.value === undefined
		? []
		: (resourcesStore.leaderboards[selectedType.value]?.rows ?? []),
)

const openTypeId = ref<number>()

const typeRows = computed(() =>
	types.value.map((type) => ({
		type,
		open: openTypeId.value === type.id,
		unit: type.unitForms.join(' / '),
		bounds: formatBounds(type.minimum, type.maximum),
		value: myPoints.value[type.id] ?? 0,
	})),
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
		</div>

		<div class="table">
			<div class="table__row table__row--head">
				<span>Игрок</span>
				<span class="table__right">{{ selectedName }} ↓</span>
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
						:color="`var(--user-${row.user.colorIndex})`"
						:size="28"
					/>
					{{ row.user.login }}
					<UiBadge v-if="row.user.login === sessionStore.login" tone="accent">ты</UiBadge>
				</span>
				<span class="table__value">{{ row.value }}</span>
			</div>
		</div>

		<div class="info">
			<div class="info__row info__row--head">
				<span class="info__name-head">Тип очков</span>
				<span>Единица в журнале</span>
				<span>Границы</span>
				<span class="table__right">У тебя</span>
			</div>

			<div
				v-for="row in typeRows"
				:key="row.type.id"
				class="info__item"
				:class="{ 'info__item--open': row.open }"
			>
				<div
					class="info__row info__row--body"
					@click="openTypeId = row.open ? undefined : row.type.id"
				>
					<div class="info__name">
						<span class="info__chevron">
							<UiIcon :name="row.open ? 'chevron-down' : 'chevron-right'" :size="16" />
						</span>
						<span class="info__title">{{ row.type.name }}</span>
					</div>
					<span class="info__text">{{ row.unit }}</span>
					<span class="info__text">{{ row.bounds }}</span>
					<span class="table__value">{{ row.value }}</span>
				</div>

				<div v-if="row.open" class="info__desc">
					<span class="label">Описание</span>
					<span class="info__text">{{ row.type.description || 'Без описания' }}</span>
					<span class="info__start">Стартовое значение: {{ row.type.startValue }}</span>
				</div>
			</div>

			<div v-if="!typeRows.length" class="info__empty">Ничего не найдено.</div>
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

.info {
	grid-column: 1 / -1;
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.info__row {
	display: grid;
	grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.5fr) minmax(0, 1fr) 120px;
	gap: 12px;
	align-items: center;
}

.info__row--head {
	padding: 12px 16px;
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.info__name-head {
	padding-left: 24px;
}

.info__row--body {
	min-height: 52px;
	padding: 10px 16px;
	cursor: pointer;
}

.info__row--body:hover {
	background: var(--surface-sunken);
}

.info__item {
	border-top: 1px solid var(--border-subtle);
}

.info__item--open {
	background: var(--surface-sunken);
}

.info__name {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}

.info__chevron {
	display: flex;
	flex: none;
	margin-top: 3px;
	color: var(--text-muted);
}

.info__title {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.info__text {
	font: var(--type-body-sm);
	color: var(--text-body);
	text-wrap: pretty;
}

.info__desc {
	display: flex;
	flex-direction: column;
	gap: 6px;
	max-width: 720px;
	padding: 0 16px 16px 40px;
}

.info__start {
	font: var(--type-caption);
	color: var(--text-muted);
}

.info__empty {
	padding: 16px;
	font: var(--type-body-sm);
	color: var(--text-subtle);
	border-top: 1px solid var(--border-subtle);
}
</style>

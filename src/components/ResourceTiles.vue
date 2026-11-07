<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { UserResources } from '../api-facade/contracts'
import { RouteName } from '../router/routeNames'
import { useResourcesStore } from '../stores/resourcesStore'
import { formatRemaining } from '../utils/format'
import { groupItems } from '../utils/userItems'
import UiBadge from './ui/UiBadge.vue'

type Props = {
	resources?: UserResources
	/** tiles of the current user: «Мои очки» and no user in the links */
	mine?: boolean
}

const { resources, mine } = defineProps<Props>()

const resourcesStore = useResourcesStore()

const MAIN_POINTS_COUNT = 3

const points = computed(() =>
	resourcesStore.personalTypes
		.slice(0, MAIN_POINTS_COUNT)
		.map((type) => ({ id: type.id, name: type.name, value: resources?.points[type.id] ?? 0 })),
)

const items = computed(() => groupItems(resources?.items ?? []))

const linkTo = (tab: string): RouteLocationRaw => ({
	name: RouteName.Resources,
	params: { tab },
	query: mine || tab === 'points' ? undefined : { user: resources?.user.login },
})
</script>

<template>
	<div class="tiles">
		<div class="tile">
			<div class="tile__head">
				<span class="tile__title">{{ mine ? 'Мои очки' : 'Очки' }}</span>
				<RouterLink class="tile__link" :to="linkTo('points')">Все</RouterLink>
			</div>
			<div v-for="point in points" :key="point.id" class="row">
				<span class="row__name" :title="point.name">{{ point.name }}</span>
				<span class="row__value">{{ point.value }}</span>
			</div>
		</div>

		<div class="tile">
			<div class="tile__head">
				<span class="tile__title">Предметы</span>
				<RouterLink class="tile__link" :to="linkTo('items')">Все</RouterLink>
			</div>
			<div v-for="item in items" :key="item.itemId" class="row row--items">
				<span class="row__name" :title="item.name">{{ item.name }}</span>
				<span class="row__value row__value--right">{{ item.count }}</span>
			</div>
			<span v-if="!resources?.items.length" class="tile__empty">Пусто</span>
		</div>

		<div class="tile">
			<div class="tile__head">
				<span class="tile__title">Перки</span>
				<RouterLink class="tile__link" :to="linkTo('perks')">Все</RouterLink>
			</div>
			<span v-for="perk in resources?.perks" :key="perk.id" class="row__text" :title="perk.name">
				{{ perk.name }}
			</span>
			<span v-if="!resources?.perks.length" class="tile__empty">Пусто</span>
		</div>

		<div class="tile">
			<div class="tile__head">
				<span class="tile__title">Эффекты</span>
				<RouterLink class="tile__link" :to="linkTo('effects')">Все</RouterLink>
			</div>
			<div v-for="effect in resources?.effects" :key="effect.id" class="row row--effects">
				<span class="row__name" :title="effect.name">{{ effect.name }}</span>
				<span class="row__badge">
					<UiBadge>{{ effect.expiresAt ? formatRemaining(effect.expiresAt) : '∞' }}</UiBadge>
				</span>
			</div>
			<span v-if="!resources?.effects.length" class="tile__empty">Пусто</span>
		</div>
	</div>
</template>

<style scoped>
.tiles {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	grid-template-rows: repeat(2, minmax(0, 1fr));
	gap: 16px;
}

.tile {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.tile__head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
}

.tile__title {
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.tile__link {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
}

.tile__empty {
	font: var(--type-body-sm);
	color: var(--text-subtle);
}

.row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	font: var(--type-body-sm);
}

.row__value {
	flex-shrink: 0;
	font: 600 14px / 1.45 var(--font-mono);
	color: var(--text-strong);
}

.row__text {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font: var(--type-body-sm);
}

.row--items {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 32px;
	gap: 8px;
}

.row--effects {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 88px;
	gap: 8px;
	align-items: center;
	min-height: 24px;
}

.row__value--right,
.row__uses {
	text-align: right;
}

.row__uses {
	font: var(--type-mono);
	color: var(--text-subtle);
}

.row__name {
	grid-column: 1;
	grid-row: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.row__badge {
	grid-column: 2;
	grid-row: 1;
	display: flex;
	justify-content: flex-end;
	white-space: nowrap;
}

.row__badge :deep(.ui-badge) {
	justify-content: center;
	min-width: 100%;
}
</style>

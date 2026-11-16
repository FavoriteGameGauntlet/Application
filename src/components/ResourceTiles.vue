<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { UserResources } from '../api-facade/contracts'
import { RouteName } from '../router/routeNames'
import { useResourcesStore } from '../stores/resourcesStore'
import { formatRemaining } from '../utils/format'
import { groupItems } from '../utils/userItems'
import CatalogHoverCard from './CatalogHoverCard.vue'
import type { CatalogView } from './catalogTable'
import UiBadge from './ui/UiBadge.vue'
import UiScrollArea from './ui/UiScrollArea.vue'

type Props = {
	resources?: UserResources
	/** tiles of the current user: «Мои очки» and no user in the links */
	mine?: boolean
}

const { resources, mine } = defineProps<Props>()

const resourcesStore = useResourcesStore()

const points = computed(() =>
	resourcesStore.personalTypes.map((type) => ({
		id: type.id,
		name: type.name,
		value: resources?.points[type.id] ?? 0,
	})),
)

const items = computed(() => groupItems(resources?.items ?? []))

const linkTo = (tab: string): RouteLocationRaw => ({
	name: RouteName.Resources,
	params: { tab },
	query: mine || tab === 'points' ? undefined : { user: resources?.user.login },
})

type HoverView = Extract<CatalogView, 'points' | 'items' | 'perks' | 'effects'>

const hovered = ref<{ view: HoverView; id: number; anchor: HTMLElement }>()

const hover = (view: HoverView, id: number, event: MouseEvent) => {
	hovered.value = { view, id, anchor: event.currentTarget as HTMLElement }
}

const hoveredEntry = computed(
	() =>
		hovered.value &&
		resourcesStore.catalogEntryOf(hovered.value.view, hovered.value.id),
)
</script>

<template>
	<div class="tiles">
		<div class="tile">
			<div class="tile__head">
				<span class="tile__title">{{ mine ? 'Мои очки' : 'Очки' }}</span>
				<RouterLink class="tile__link" :to="linkTo('points')">Все</RouterLink>
			</div>
			<UiScrollArea class="tile__list">
				<div
					v-for="point in points"
					:key="point.id"
					class="row"
					@mouseenter="hover('points', point.id, $event)"
					@mouseleave="hovered = undefined"
				>
					<span class="row__name">{{ point.name }}</span>
					<span class="row__value">{{ point.value }}</span>
				</div>
			</UiScrollArea>
		</div>

		<div class="tile">
			<div class="tile__head">
				<span class="tile__title">Предметы</span>
				<RouterLink class="tile__link" :to="linkTo('items')">Все</RouterLink>
			</div>
			<UiScrollArea v-if="items.length" class="tile__list">
				<div
					v-for="item in items"
					:key="item.itemId"
					class="row"
					@mouseenter="hover('items', item.itemId, $event)"
					@mouseleave="hovered = undefined"
				>
					<span class="row__name">{{ item.name }}</span>
					<UiBadge>{{ item.usesLeft }} из {{ item.usesMax }}</UiBadge>
					<span class="row__value">{{ item.count }}</span>
				</div>
			</UiScrollArea>
			<span v-else class="tile__empty">Пусто</span>
		</div>

		<div class="tile">
			<div class="tile__head">
				<span class="tile__title">Перки</span>
				<RouterLink class="tile__link" :to="linkTo('perks')">Все</RouterLink>
			</div>
			<UiScrollArea v-if="resources?.perks.length" class="tile__list">
				<div
					v-for="perk in resources.perks"
					:key="perk.id"
					class="row"
					@mouseenter="hover('perks', perk.id, $event)"
					@mouseleave="hovered = undefined"
				>
					<span class="row__name">{{ perk.name }}</span>
					<UiBadge v-if="perk.usesMax !== undefined"
						>{{ perk.usesLeft ?? 0 }} из {{ perk.usesMax }}</UiBadge
					>
				</div>
			</UiScrollArea>
			<span v-else class="tile__empty">Пусто</span>
		</div>

		<div class="tile">
			<div class="tile__head">
				<span class="tile__title">Эффекты</span>
				<RouterLink class="tile__link" :to="linkTo('effects')">Все</RouterLink>
			</div>
			<UiScrollArea v-if="resources?.effects.length" class="tile__list">
				<div
					v-for="effect in resources.effects"
					:key="effect.id"
					class="row"
					@mouseenter="hover('effects', effect.effectId, $event)"
					@mouseleave="hovered = undefined"
				>
					<span class="row__name">{{ effect.name }}</span>
					<UiBadge>{{
						effect.expiresAt ? formatRemaining(effect.expiresAt) : '∞'
					}}</UiBadge>
				</div>
			</UiScrollArea>
			<span v-else class="tile__empty">Пусто</span>
		</div>

		<CatalogHoverCard
			:anchor="hovered?.anchor"
			:view="hovered?.view ?? 'items'"
			:entry="hoveredEntry"
			side="right"
			@close="hovered = undefined"
		/>
	</div>
</template>

<style scoped>
/* the tiles take the height the grid gives them and never stretch the page: their lists scroll */
.tiles {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	grid-template-rows: repeat(2, minmax(0, 1fr));
	gap: 16px;
	min-height: 320px;
	contain: size;
}

.tile {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-height: 0;
	padding: 16px 16px 6px;
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.tile__head {
	display: flex;
	flex: none;
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
	color: var(--text-muted);
}

/* the rows reach into the tile padding for their hover plate, the bar sits in the right padding */
.tile__list {
	display: flex;
	flex: 1;
	flex-direction: column;
	margin: 0 -12px 0 -8px;
	padding: 0 2px 10px 0;
}

.row {
	display: flex;
	flex: none;
	align-items: center;
	gap: 8px;
	cursor: default;
	min-height: 36px;
	padding: 6px 8px;
	font: var(--type-body-sm);
	border-radius: var(--radius-md);
	transition: background var(--dur-fast) var(--ease-out);
}

.row:hover {
	background: var(--surface-sunken);
}

.row__name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.row__value {
	flex-shrink: 0;
	min-width: 24px;
	font: 600 14px / 1.45 var(--font-mono);
	color: var(--text-strong);
	text-align: right;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ResourceKind } from '../../api-facade/contracts'
import UiTabs from '../../components/ui/UiTabs.vue'
import { RouteName } from '../../router/routeNames'
import HistoryTab from './components/HistoryTab.vue'
import PlayerResourcesTab from './components/PlayerResourcesTab.vue'
import PointsTab from './components/PointsTab.vue'

const tabs = [
	{ value: 'points', label: 'Очки' },
	{ value: 'items', label: 'Предметы' },
	{ value: 'perks', label: 'Перки' },
	{ value: 'effects', label: 'Эффекты' },
	{ value: 'history', label: 'История' },
]

const route = useRoute()
const router = useRouter()

const tab = computed(() => {
	const value = route.params.tab as string | undefined

	return tabs.some((t) => t.value === value) ? value! : 'points'
})

const resourceKind = computed(() => tab.value as ResourceKind)

const player = computed(() => route.query.player as string | undefined)

const setTab = (value: string | undefined) =>
	router.push({
		name: RouteName.Resources,
		params: { tab: value },
		query: route.query,
	})
</script>

<template>
	<div class="resources">
		<span class="resources__title">Ресурсы</span>

		<UiTabs :model-value="tab" :items="tabs" @update:model-value="setTab" />

		<PointsTab v-if="tab === 'points'" />
		<HistoryTab v-else-if="tab === 'history'" :player />
		<PlayerResourcesTab v-else :key="tab" :kind="resourceKind" :player />
	</div>
</template>

<style scoped>
.resources {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.resources__title {
	font: var(--type-h2);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}
</style>

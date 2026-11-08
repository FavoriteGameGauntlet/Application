<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ResourceKind } from '../../api-facade/contracts'
import UiPageTitle from '../../components/ui/UiPageTitle.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { RouteName } from '../../router/routeNames'
import HistoryTab from './components/HistoryTab.vue'
import UserResourcesTab from './components/UserResourcesTab.vue'
import PointsTab from './components/PointsTab.vue'
import SharedPointsTab from './components/SharedPointsTab.vue'

const tabs = [
	{ value: 'points', label: 'Очки' },
	{ value: 'shared', label: 'Общие очки' },
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

const user = computed(() => route.query.user as string | undefined)

const setTab = (value: string | undefined) =>
	router.push({
		name: RouteName.Resources,
		params: { tab: value },
		query: route.query,
	})
</script>

<template>
	<div class="resources">
		<UiPageTitle>Ресурсы</UiPageTitle>

		<UiTabs :model-value="tab" :items="tabs" @update:model-value="setTab" />

		<PointsTab v-if="tab === 'points'" />
		<SharedPointsTab v-else-if="tab === 'shared'" />
		<HistoryTab v-else-if="tab === 'history'" :user />
		<UserResourcesTab v-else :key="tab" :kind="resourceKind" :user />
	</div>
</template>

<style scoped>
.resources {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>

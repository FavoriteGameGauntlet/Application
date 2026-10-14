<script setup lang="ts">
import { ref, watch } from 'vue'
import type { JournalEntry } from '../../api-facade/contracts'
import CurrentGameCard from '../../components/CurrentGameCard.vue'
import EventFeed from '../../components/EventFeed.vue'
import ResourceTiles from '../../components/ResourceTiles.vue'
import { RouteName } from '../../router/routeNames'
import { useJournalStore } from '../../stores/journalStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'

const RECENT_EVENTS_COUNT = 3

const journalStore = useJournalStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

const recent = ref<JournalEntry[]>([])

watch(
	() => journalStore.revision,
	async () => {
		recent.value = await journalStore.fetch({
			player: sessionStore.login,
			limit: RECENT_EVENTS_COUNT,
		})
	},
	{ immediate: true },
)
</script>

<template>
	<div class="home">
		<CurrentGameCard with-timer />

		<div class="home__grid">
			<ResourceTiles mine :resources="resourcesStore.byPlayer[sessionStore.login]" />

			<EventFeed
				title="Недавние события"
				link-label="Вся история"
				:link-to="{ name: RouteName.Resources, params: { tab: 'history' } }"
				:entries="recent"
			/>
		</div>
	</div>
</template>

<style scoped>
.home {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 20px;
}

.home__grid {
	display: grid;
	flex: 1;
	grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
	gap: 20px;
}
</style>

<script setup lang="ts">
import CurrentGameCard from '../../components/CurrentGameCard.vue'
import PlayerEvents from '../../components/PlayerEvents.vue'
import ResourceTiles from '../../components/ResourceTiles.vue'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'

const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()
</script>

<template>
	<div class="home">
		<CurrentGameCard with-timer />

		<div class="home__grid">
			<ResourceTiles mine :resources="resourcesStore.byUser[sessionStore.login]" />

			<PlayerEvents :login="sessionStore.login" />
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

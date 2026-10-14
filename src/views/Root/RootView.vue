<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCurrentGameStore } from '../../stores/currentGameStore'
import { useMembersStore } from '../../stores/membersStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useTimerStore } from '../../stores/timerStore'
import { useToastStore } from '../../stores/toastStore'
import AppSidebar from './components/AppSidebar.vue'
import AppTopbar from './components/AppTopbar.vue'

const isReady = ref(false)

onMounted(async () => {
	try {
		await useSessionStore().load()
		await Promise.all([
			useMembersStore().load(),
			useResourcesStore().loadPointTypes(),
			useResourcesStore().loadMine(),
			useCurrentGameStore().load(),
			useTimerStore().load(),
		])
	} catch (e) {
		useToastStore().error(e)
	}

	isReady.value = true
})
</script>

<template>
	<div v-if="isReady" class="layout">
		<AppSidebar />

		<div class="main">
			<AppTopbar />

			<div class="scroll">
				<div class="content">
					<RouterView />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.layout {
	display: flex;
	height: 100%;
	min-width: 1100px;
	background: var(--surface-page);
}

.main {
	display: flex;
	flex: 1;
	flex-direction: column;
	min-width: 0;
}

.scroll {
	flex: 1;
	min-height: 0;
	overflow: auto;
}

.content {
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-height: 100%;
	max-width: var(--container-max);
	padding: 24px 32px;
}
</style>

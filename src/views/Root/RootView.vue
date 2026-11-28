<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePresence } from '../../composables/usePresence'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { RouteName } from '../../router/routeNames'
import { useCurrentGameStore } from '../../stores/currentGameStore'
import { useManualStore } from '../../stores/manualStore'
import { useMembersStore } from '../../stores/membersStore'
import { useMiniModeStore } from '../../stores/miniModeStore'
import { useParametersStore } from '../../stores/parametersStore'
import { useResourcesStore } from '../../stores/resourcesStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useTimerStore } from '../../stores/timerStore'
import { useToastStore } from '../../stores/toastStore'
import AppSidebar from './components/AppSidebar.vue'
import AppTopbar from './components/AppTopbar.vue'
import MiniTimer from './components/MiniTimer.vue'

const route = useRoute()
const router = useRouter()
const miniModeStore = useMiniModeStore()
const manualStore = useManualStore()

onBeforeUnmount(() => manualStore.resolveReplacement(false))

usePresence()

const isReady = ref(false)

onMounted(async () => {
	useParametersStore().parameters = []

	try {
		await useSessionStore().load()

		// the admin panel is only for the admins of the party
		if (route.matched.some((r) => r.meta.admin) && !useSessionStore().isAdmin) {
			await router.replace({ name: RouteName.Home })
		}

		await Promise.all([
			useParametersStore().load(),
			useMembersStore().load(),
			useResourcesStore().loadPointTypes(),
			useResourcesStore().loadMine(),
			useCurrentGameStore().load(),
			useTimerStore().loadReward(),
		])
	} catch (e) {
		useToastStore().error(e)
	}

	isReady.value = true
})
</script>

<template>
	<template v-if="isReady">
		<MiniTimer v-if="miniModeStore.isMini" />
		<ConfirmDialog
			:open="manualStore.replacing"
			title="Заменить ручное изменение?"
			text="Есть незавершённое ручное изменение. Если продолжить, его черновик будет заменён новым."
			ok-label="Заменить"
			cancel-label="Сохранить черновик"
			@confirm="manualStore.resolveReplacement(true)"
			@close="manualStore.resolveReplacement(false)"
		/>

		<!-- hidden, not removed, so the screen comes back as it was -->
		<div v-show="!miniModeStore.isMini" class="layout">
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
	margin: 0 auto;
	padding: 24px 32px;
}
</style>

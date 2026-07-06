<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import FreePointsForm from './components/FreePointsForm.vue'

const authStore = useAuthStore()
const userStore = useFeatureUserStore()

const login = computed(() => authStore.login)

const freePoints = computed(() =>
	login.value ? (userStore.userFreePoints[login.value] ?? null) : null,
)
const territoryPoints = computed(() =>
	login.value ? (userStore.userTerritoryPoints[login.value] ?? null) : null,
)

const isLoading = computed(
	() =>
		userStore.getUserFreePointsState.isLoading ||
		userStore.getUserTerritoryPointsState.isLoading,
)
const isError = computed(
	() =>
		userStore.getUserFreePointsState.isError ||
		userStore.getUserTerritoryPointsState.isError,
)
const isLoaded = computed(
	() =>
		userStore.getUserFreePointsState.isLoaded &&
		userStore.getUserTerritoryPointsState.isLoaded,
)

const loadPoints = () => {
	if (!login.value) return

	userStore.getUserFreePoints(login.value)
	userStore.getUserTerritoryPoints(login.value)
}

onMounted(loadPoints)
watch(login, loadPoints)
</script>

<template>
	<UiView>
		<div class="points">
			<h1>Очки</h1>

			<p v-if="isLoading">Загрузка...</p>
			<p v-else-if="isError">Ошибка загрузки</p>
			<dl v-else-if="isLoaded" class="points-info">
				<div class="points-row">
					<dt>Свободные очки</dt>
					<dd class="points-row__value">
						{{ freePoints }}
						<FreePointsForm v-if="login" :login="login" />
					</dd>
				</div>
				<div class="points-row">
					<dt>Очки территорий</dt>
					<dd>{{ territoryPoints }}</dd>
				</div>
			</dl>
		</div>
	</UiView>
</template>

<style scoped>
.points {
	display: flex;
	flex-direction: column;
	gap: 20px;
	width: 100%;
}

.points-info {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.points-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
}

.points-row dt {
	color: #475569;
}

.points-row dd {
	font-weight: 500;
	margin: 0;
}

.points-row__value {
	display: flex;
	align-items: center;
	gap: 8px;
}
</style>

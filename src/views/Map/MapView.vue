<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import TerritoryHoursForm from './components/TerritoryHoursForm.vue'

const authStore = useAuthStore()
const userStore = useFeatureUserStore()

const login = computed(() => authStore.login)

const territoryHours = computed(() => userStore.userTerritoryHours)

const isLoading = computed(
	() => userStore.getUserTerritoryHoursState.isLoading,
)
const isError = computed(() => userStore.getUserTerritoryHoursState.isError)
const isLoaded = computed(() => userStore.getUserTerritoryHoursState.isLoaded)

const loadPoints = () => {
	if (!login.value) return

	userStore.getUserTerritoryHours()
}

onMounted(loadPoints)
watch(login, loadPoints)
</script>

<template>
	<UiView>
		<div class="map">
			<h1>Карта</h1>

			<p v-if="isLoading">Загрузка...</p>
			<p v-else-if="isError">Ошибка загрузки</p>
			<dl v-else-if="isLoaded" class="points-info">
				<div class="points-row">
					<dt>Часы территорий</dt>
					<dd class="points-row__value">
						{{ territoryHours }}
						<TerritoryHoursForm />
					</dd>
				</div>
			</dl>
		</div>
	</UiView>
</template>

<style scoped>
.map {
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

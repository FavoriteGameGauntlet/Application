<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import ExperiencePointsForm from './components/ExperiencePointsForm.vue'

const authStore = useAuthStore()
const userStore = useFeatureUserStore()

const login = computed(() => authStore.login)
const pointsInfo = computed(() =>
	login.value ? (userStore.userPoints[login.value] ?? null) : null,
)

const loadPoints = () => {
	if (login.value) userStore.getUserPoints(login.value)
}

onMounted(loadPoints)
watch(login, loadPoints)
</script>

<template>
	<UiView>
		<div class="points">
			<h1>Очки</h1>

			<p v-if="userStore.getUserPointsState.isLoading">Загрузка...</p>
			<p v-else-if="userStore.getUserPointsState.isError">Ошибка загрузки</p>
			<template v-else-if="userStore.getUserPointsState.isLoaded">
				<p v-if="!pointsInfo" class="empty-message">Нет данных</p>
				<dl v-else class="points-info">
					<div class="points-row">
						<dt>Очки опыта</dt>
						<dd class="points-row__value">
							{{ pointsInfo.experiencePoints }}
							<ExperiencePointsForm v-if="login" :login="login" />
						</dd>
					</div>
					<div class="points-row">
						<dt>Свободные очки</dt>
						<dd>{{ pointsInfo.freePoints }}</dd>
					</div>
					<div class="points-row">
						<dt>Очки территорий</dt>
						<dd>{{ pointsInfo.territoryPoints }}</dd>
					</div>
					<div class="points-row">
						<dt>Часы территорий</dt>
						<dd>{{ pointsInfo.territoryHours }}</dd>
					</div>
					<div class="points-row">
						<dt>Доступных бросков</dt>
						<dd>{{ pointsInfo.availableRolls }}</dd>
					</div>
				</dl>
			</template>
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

.empty-message {
	color: #64748b;
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

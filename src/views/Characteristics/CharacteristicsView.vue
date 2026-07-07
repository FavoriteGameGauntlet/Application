<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import ExperiencePointsForm from './components/ExperiencePointsForm.vue'

const authStore = useAuthStore()
const userStore = useFeatureUserStore()

const login = computed(() => authStore.login)

const experiencePoints = computed(() => userStore.userExperiencePoints)

const isLoading = computed(
	() => userStore.getUserExperiencePointsState.isLoading,
)
const isError = computed(() => userStore.getUserExperiencePointsState.isError)
const isLoaded = computed(
	() => userStore.getUserExperiencePointsState.isLoaded,
)

const loadPoints = () => {
	if (!login.value) return

	userStore.getUserExperiencePoints()
}

onMounted(loadPoints)
watch(login, loadPoints)
</script>

<template>
	<UiView>
		<div class="characteristics">
			<h1>Характеристики</h1>

			<p v-if="isLoading">Загрузка...</p>
			<p v-else-if="isError">Ошибка загрузки</p>
			<dl v-else-if="isLoaded" class="points-info">
				<div class="points-row">
					<dt>Очки опыта</dt>
					<dd class="points-row__value">
						{{ experiencePoints }}
						<ExperiencePointsForm />
					</dd>
				</div>
			</dl>
		</div>
	</UiView>
</template>

<style scoped>
.characteristics {
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

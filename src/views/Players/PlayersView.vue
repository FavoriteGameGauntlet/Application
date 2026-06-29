<script setup lang="ts">
import { onMounted } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import { RouteName } from '../../router/routeNames'

const userStore = useFeatureUserStore()
const authStore = useAuthStore()

onMounted(() => userStore.getAllUsers())
</script>

<template>
	<UiView>
		<h1>Игроки</h1>

		<p v-if="userStore.getAllNamesState.isLoading">Загрузка...</p>
		<p v-else-if="userStore.getAllNamesState.isError">Ошибка загрузки</p>
		<template v-else>
			<ul v-if="userStore.users?.length" class="players-list">
				<li
					v-for="user in userStore.users"
					:key="user.login"
					class="player-item"
				>
					<RouterLink
						:to="{
							name: RouteName.PlayerDetail,
							params: { login: user.login },
						}"
						class="player-link"
					>
						<span class="player-name">{{
							user.displayName ?? user.login
						}}</span>
						<span v-if="user.login === authStore.login" class="player-you"
							>Вы</span
						>
					</RouterLink>
				</li>
			</ul>
			<p v-else>Нет игроков</p>
		</template>
	</UiView>
</template>

<style scoped>
h1 {
	margin-block-end: 1.5rem;
	align-self: flex-start;
}

.players-list {
	display: flex;
	flex-direction: column;
	gap: 4px;
	list-style: none;
	padding: 0;
	width: 100%;
}

.player-item {
	width: 100%;
}

.player-link {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	text-decoration: none;
	color: inherit;
}

.player-link:hover {
	background-color: #f8fafc;
}

.player-name {
	flex: 1;
}

.player-you {
	font-size: 0.75rem;
	background-color: #e2e8f0;
	color: #475569;
	padding: 2px 8px;
	border-radius: 9999px;
}
</style>

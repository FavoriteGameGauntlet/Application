<script setup lang="ts">
import { onMounted } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import { RouteName } from '../../router/routeNames'

const userStore = useFeatureUserStore()

onMounted(() => userStore.getAllUsers())
</script>

<template>
	<UiView>
		<h1>Игроки</h1>

		<p v-if="userStore.getAllNamesState.isLoading">Загрузка...</p>
		<p v-else-if="userStore.getAllNamesState.isError">Ошибка загрузки</p>
		<template v-else>
			<div class="users-grid">
				<RouterLink
					v-for="user in userStore.otherUsers"
					:key="user.login"
					:to="{ name: RouteName.UserDetail, params: { login: user.login } }"
					class="user-tile"
				>
					<span class="user-login">{{ user.login }}</span>
					<span class="user-meta">{{ user.displayName }}</span>
				</RouterLink>
			</div>
		</template>
	</UiView>
</template>

<style scoped>
h1 {
	margin-block-end: 1.5rem;
	align-self: flex-start;
}

.users-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	width: 100%;
}

.user-tile {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	text-decoration: none;
	color: inherit;
}

.user-tile:hover {
	background-color: #f8fafc;
}

.user-login {
	font-weight: 600;
}

.user-meta {
	font-size: 0.8125rem;
	color: #64748b;
}
</style>

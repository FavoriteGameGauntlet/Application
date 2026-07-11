<script setup lang="ts">
import { onMounted } from 'vue'
import UiView from '../../components/ui/UiView.vue'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import { RouteName } from '../../router/routeNames'
import UserListItem from './components/UserListItem.vue'

const userStore = useFeatureUserStore()

onMounted(async () => {
	await userStore.getAllUsers()

	await Promise.all([
		userStore.getAllUsersCurrentGames(),
		userStore.getAllUsersPoints(),
	])
})
</script>

<template>
	<UiView>
		<h1>Игроки</h1>

		<p v-if="userStore.getAllNamesState.isLoading">Загрузка...</p>
		<p v-else-if="userStore.getAllNamesState.isError">Ошибка загрузки</p>
		<template v-else>
			<div class="users-list">
				<RouterLink
					v-for="user in userStore.otherUsers"
					:key="user.login"
					:to="{ name: RouteName.UserDetail, params: { login: user.login } }"
					class="user-row"
				>
					<UserListItem :login="user.login" :display-name="user.displayName" />
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

.users-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
	width: 100%;
}

.user-row {
	display: flex;
	align-items: flex-start;
	padding: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	text-decoration: none;
	color: inherit;
}

.user-row:hover {
	background-color: #f8fafc;
}
</style>

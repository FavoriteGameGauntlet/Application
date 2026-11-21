<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useClickOutside } from '../composables/useClickOutside'
import { useAuthStore } from '../stores/authStore'
import { useMembersStore } from '../stores/membersStore'
import UiIcon from './ui/UiIcon.vue'
import UiUserAvatar from './ui/UiUserAvatar.vue'
import UserSettingsDialog from './UserSettingsDialog.vue'

const { inParty } = defineProps<{ inParty?: boolean }>()

const authStore = useAuthStore()
const membersStore = useMembersStore()

/** the party screen has no session yet, only the stored login */
const login = computed(() => authStore.login ?? '')

const menuOpen = ref(false)
const userMenu = useTemplateRef('userMenu')

useClickOutside(userMenu, () => (menuOpen.value = false))

const settingsOpen = ref(false)

const onOpenSettings = () => {
	menuOpen.value = false
	settingsOpen.value = true
}

const onLogOut = () => {
	menuOpen.value = false
	authStore.logOut()
}
</script>

<template>
	<div ref="userMenu" class="user-menu">
		<div class="user-menu__trigger" @click="menuOpen = !menuOpen">
			<UiUserAvatar
				:name="login"
				:color="membersStore.colorOf(login)"
				:src="inParty ? membersStore.avatarOf(login) : undefined"
				:size="28"
			/>
			{{ login }}
			<UiIcon name="chevron-down" :size="16" />
		</div>

		<div v-if="menuOpen" class="user-menu__popup">
			<div class="user-menu__item" @click="onOpenSettings">
				<UiIcon name="settings" :size="16" />
				Настройки
			</div>

			<div class="user-menu__item" @click="onLogOut">
				<UiIcon name="log-out" :size="16" />
				Выйти
			</div>
		</div>

		<UserSettingsDialog :open="settingsOpen" @close="settingsOpen = false" />
	</div>
</template>

<style scoped>
.user-menu {
	position: relative;
}

.user-menu__trigger,
.user-menu__item {
	display: flex;
	align-items: center;
	gap: 10px;
	height: 40px;
	font: 600 14px / 1 var(--font-body);
	color: var(--text-strong);
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.user-menu__trigger {
	padding: 0 10px 0 6px;
}

.user-menu__trigger:hover,
.user-menu__item:hover {
	background: var(--surface-sunken);
}

.user-menu__popup {
	position: absolute;
	top: 46px;
	right: 0;
	display: flex;
	flex-direction: column;
	width: 200px;
	padding: 4px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
}

.user-menu__item {
	padding: 0 12px;
}
</style>

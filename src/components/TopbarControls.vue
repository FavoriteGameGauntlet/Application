<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, USE_MOCKS } from '../api-facade/api'
import { useClickOutside } from '../composables/useClickOutside'
import { RouteName } from '../router/routeNames'
import { useAuthStore } from '../stores/authStore'
import { useJournalStore } from '../stores/journalStore'
import { useMembersStore } from '../stores/membersStore'
import { useResourcesStore } from '../stores/resourcesStore'
import { SCALES, useScaleStore } from '../stores/scaleStore'
import { useSessionStore } from '../stores/sessionStore'
import { useThemeStore } from '../stores/themeStore'
import { useToastStore } from '../stores/toastStore'
import UiIcon from './ui/UiIcon.vue'
import UiSelect from './ui/UiSelect.vue'
import UiUserAvatar from './ui/UiUserAvatar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const journalStore = useJournalStore()
const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const scaleStore = useScaleStore()
const sessionStore = useSessionStore()
const themeStore = useThemeStore()
const toastStore = useToastStore()

const scaleOptions = SCALES.map((s) => ({ value: String(s), label: `${s}%` }))

/** the party screen has no session yet, only the stored login */
const login = computed(() => authStore.login ?? '')

const menuOpen = ref(false)
const userMenu = useTemplateRef('userMenu')

useClickOutside(userMenu, () => (menuOpen.value = false))

/** the role depends on what the endpoints answer, so everything that hangs on it is reloaded */
const onSwitchRole = async () => {
	menuOpen.value = false

	try {
		await api.session.setRole(sessionStore.isAdmin ? 'user' : 'admin')
		await sessionStore.load()
		await Promise.all([resourcesStore.loadPointTypes(), resourcesStore.loadMine()])
		journalStore.bump()

		// the admin panel is only for the admins of the party
		if (!sessionStore.isAdmin && route.matched.some((r) => r.meta.admin)) {
			await router.replace({ name: RouteName.Home })
		}
	} catch (e) {
		toastStore.error(e)
	}
}

const onLogOut = () => {
	menuOpen.value = false
	authStore.logOut()
}
</script>

<template>
	<div ref="userMenu" class="user-menu">
		<div class="user-menu__trigger" @click="menuOpen = !menuOpen">
			<UiUserAvatar :name="login" :color="membersStore.colorOf(login)" :size="28" />
			{{ login }}
			<UiIcon name="chevron-down" :size="16" />
		</div>

		<div v-if="menuOpen" class="user-menu__popup">
			<div class="user-menu__setting">
				Масштаб

				<div class="user-menu__scale">
					<UiSelect
						compact
						aria-label="Масштаб интерфейса"
						:options="scaleOptions"
						:model-value="String(scaleStore.scale)"
						@update:model-value="scaleStore.set(Number($event))"
					/>
				</div>
			</div>

			<div class="user-menu__item" @click="themeStore.toggle()">
				<UiIcon :name="themeStore.isDark ? 'sun' : 'moon'" :size="16" />
				{{ themeStore.isDark ? 'Светлая тема' : 'Тёмная тема' }}
			</div>

			<div
				v-if="USE_MOCKS && sessionStore.me"
				class="user-menu__item"
				title="Только на моках: на бэкенде роль выдают админы пати"
				@click="onSwitchRole"
			>
				<UiIcon name="shield" :size="16" />
				{{ sessionStore.isAdmin ? 'Стать игроком' : 'Стать админом' }}
			</div>

			<span class="user-menu__divider"></span>

			<div class="user-menu__item" @click="onLogOut">
				<UiIcon name="log-out" :size="16" />
				Выйти
			</div>
		</div>
	</div>
</template>

<style scoped>
.user-menu {
	position: relative;
}

.user-menu__trigger,
.user-menu__item,
.user-menu__setting {
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

.user-menu__setting {
	justify-content: space-between;
	padding: 0 4px 0 12px;
	cursor: default;
}

.user-menu__scale {
	width: 96px;
}

.user-menu__divider {
	height: 1px;
	margin: 4px 0;
	background: var(--border-subtle);
}
</style>

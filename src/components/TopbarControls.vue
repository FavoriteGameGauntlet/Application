<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useClickOutside } from '../composables/useClickOutside'
import { useAuthStore } from '../stores/authStore'
import { useMembersStore } from '../stores/membersStore'
import { SCALES, useScaleStore } from '../stores/scaleStore'
import { useThemeStore } from '../stores/themeStore'
import { useTimerSoundStore } from '../stores/timerSoundStore'
import UiIcon from './ui/UiIcon.vue'
import UiIconButton from './ui/UiIconButton.vue'
import UiSelect from './ui/UiSelect.vue'
import UiSwitch from './ui/UiSwitch.vue'
import UiUserAvatar from './ui/UiUserAvatar.vue'

const authStore = useAuthStore()
const membersStore = useMembersStore()
const scaleStore = useScaleStore()
const themeStore = useThemeStore()
const timerSoundStore = useTimerSoundStore()

const scaleOptions = SCALES.map((s) => ({ value: String(s), label: `${s}%` }))

/** the party screen has no session yet, only the stored login */
const login = computed(() => authStore.login ?? '')

const menuOpen = ref(false)
const userMenu = useTemplateRef('userMenu')

useClickOutside(userMenu, () => (menuOpen.value = false))

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
				:size="28"
			/>
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

			<div class="user-menu__setting">
				Звук таймера

				<UiSwitch
					aria-label="Звук окончания таймера"
					:model-value="timerSoundStore.enabled"
					@update:model-value="timerSoundStore.setEnabled($event)"
				/>
			</div>

			<div class="user-menu__sound">
				<UiIconButton
					size="sm"
					:icon="timerSoundStore.isPlaying ? 'pause' : 'play'"
					:label="timerSoundStore.isPlaying ? 'Остановить' : 'Послушать'"
					@click="timerSoundStore.preview()"
				/>

				<span class="user-menu__sound-name" :title="timerSoundStore.customName">
					{{ timerSoundStore.customName ?? 'Стандартный звук' }}
				</span>

				<UiIconButton
					v-if="timerSoundStore.customName"
					size="sm"
					icon="x"
					label="Вернуть стандартный звук"
					@click="timerSoundStore.reset()"
				/>
			</div>

			<div class="user-menu__item" @click="timerSoundStore.choose()">
				<UiIcon name="plus" :size="16" />
				Свой звук таймера
			</div>

			<div class="user-menu__item" @click="themeStore.toggle()">
				<UiIcon :name="themeStore.isDark ? 'sun' : 'moon'" :size="16" />
				{{ themeStore.isDark ? 'Светлая тема' : 'Тёмная тема' }}
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
	width: 240px;
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

.user-menu__sound {
	display: flex;
	align-items: center;
	gap: 2px;
	height: 40px;
	padding: 0 4px;
	font: 600 14px / 1 var(--font-body);
	color: var(--text-body);
}

.user-menu__sound-name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
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

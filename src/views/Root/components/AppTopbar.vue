<script setup lang="ts">
import { useRouter } from 'vue-router'
import TopbarControls from '../../../components/TopbarControls.vue'
import UiBadge from '../../../components/ui/UiBadge.vue'
import UiIconButton from '../../../components/ui/UiIconButton.vue'
import { RouteName } from '../../../router/routeNames'
import { useMiniModeStore } from '../../../stores/miniModeStore'
import { useSessionStore } from '../../../stores/sessionStore'

const router = useRouter()
const miniModeStore = useMiniModeStore()
const sessionStore = useSessionStore()
</script>

<template>
	<header class="topbar">
		<button
			class="season"
			type="button"
			title="Сменить пати"
			@click="router.push({ name: RouteName.Parties })"
		>
			{{ sessionStore.season?.name }}
		</button>

		<UiBadge tone="navy">{{ sessionStore.isAdmin ? 'админ' : 'игрок' }}</UiBadge>

		<div class="topbar__spacer"></div>

		<UiIconButton icon="minimize-2" label="Мини-режим" @click="miniModeStore.toggle()" />

		<TopbarControls />
	</header>
</template>

<style scoped>
.topbar {
	position: relative;
	z-index: 10;
	display: flex;
	flex: none;
	align-items: center;
	gap: 12px;
	height: var(--topbar-h);
	padding: 0 24px;
	background: var(--surface-card);
	border-bottom: 1px solid var(--border-subtle);
}

.topbar__spacer {
	flex: 1;
}

.season {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 40px;
	padding: 0 10px;
	margin-left: -10px;
	font: var(--type-h4);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
	background: transparent;
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition: background 120ms ease-out;
}

.season:hover {
	background: var(--surface-sunken);
}

.season:active {
	transform: translateY(1px);
}
</style>

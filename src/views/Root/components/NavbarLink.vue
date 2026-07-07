<script setup lang="ts">
import type { RouteName } from '../../../router/routeNames'

defineProps<{ to?: RouteName; disabled?: boolean }>()
</script>

<template>
	<RouterLink
		v-if="to"
		class="navbar-link"
		:class="{ 'navbar-link--disabled': disabled }"
		activeClass="navbar-link--active"
		:to="{ name: to }"
	>
		<slot />
	</RouterLink>

	<div v-else class="navbar-link navbar-link--disabled">
		<slot />
	</div>
</template>

<style scoped>
.navbar-link {
	display: block;
	padding: 8px 10px;
	border-radius: 7px;
	color: #2b7fff;
	text-decoration: none;
}

.navbar-link:hover {
	background-color: #eff6ff;
}

.navbar-link--active {
	color: #0f172a;
	background-color: #eff6ff;
	font-weight: 600;
}

.navbar-link--disabled {
	pointer-events: none;
	user-select: none;
	cursor: default;
	opacity: 0.4;
}
</style>

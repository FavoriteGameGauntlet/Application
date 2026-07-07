<script setup lang="ts">
import AppSidebar from './components/AppSidebar.vue'
</script>

<template>
	<div class="layout">
		<AppSidebar class="sidebar" />

		<div class="content">
			<router-view />
		</div>
	</div>
</template>

<style scoped>
.layout {
	display: flex;
	height: 100%;
}

.sidebar {
	height: 100%;
}

.content {
	height: 100%;
	max-height: 100%;
	min-height: 0;
	width: 100%;
	max-width: 100%;
	min-width: 0;
	overflow: auto;
}
</style>

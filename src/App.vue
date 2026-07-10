<script setup lang="ts">
import { RouterView } from 'vue-router'
import SystemParametersGate from './components/SystemParametersGate.vue'
import { useShortcuts } from './composables/useShortcuts'
useShortcuts()
</script>

<template>
	<SystemParametersGate>
		<RouterView />
	</SystemParametersGate>
</template>

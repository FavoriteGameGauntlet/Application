<script setup lang="ts">
import { RouterView } from 'vue-router'
import UiToastHost from './components/UiToastHost.vue'
import { useShortcuts } from './composables/useShortcuts'
useShortcuts()
</script>

<template>
	<RouterView />
	<UiToastHost />
</template>

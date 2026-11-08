<script setup lang="ts">
import { useToastStore } from '../stores/toastStore'
import UiToast from './ui/UiToast.vue'

const toastStore = useToastStore()
</script>

<template>
	<div v-if="toastStore.toast" class="toast-host">
		<UiToast
			:tone="toastStore.toast.tone"
			:title="toastStore.toast.title"
			@close="toastStore.close()"
		>
			{{ toastStore.toast.text }}
		</UiToast>
	</div>
</template>

<style scoped>
.toast-host {
	position: fixed;
	right: 24px;
	bottom: 24px;
	z-index: 200;
}
</style>

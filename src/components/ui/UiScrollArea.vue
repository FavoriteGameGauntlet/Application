<script setup lang="ts">
import { useTemplateRef } from 'vue'

const el = useTemplateRef<HTMLElement>('el')

defineExpose({ el })
</script>

<template>
	<div ref="el" class="ui-scroll-area">
		<slot />
	</div>
</template>

<style scoped>
/*
 * WebView2 and WebKitGTK draw the bar from ::-webkit-scrollbar. scrollbar-color or
 * scrollbar-width on this element or a parent would make Chromium 121+ ignore these rules.
 */
.ui-scroll-area {
	min-height: 0;
	overflow-y: auto;
	overscroll-behavior: contain;
}

.ui-scroll-area::-webkit-scrollbar {
	width: 10px;
}

.ui-scroll-area::-webkit-scrollbar-track {
	margin: 4px 0;
	background: transparent;
}

.ui-scroll-area::-webkit-scrollbar-thumb {
	min-height: 40px;
	background-color: var(--border-default);
	background-clip: padding-box;
	border: 2px solid transparent;
	border-radius: var(--radius-pill);
}

.ui-scroll-area:hover::-webkit-scrollbar-thumb {
	background-color: var(--text-subtle);
}

.ui-scroll-area::-webkit-scrollbar-thumb:hover,
.ui-scroll-area::-webkit-scrollbar-thumb:active {
	background-color: var(--text-muted);
	border-width: 1px;
}
</style>

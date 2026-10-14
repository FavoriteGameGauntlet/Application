<script setup lang="ts">
import logoOnDark from '../assets/fgg-horizontal-on-dark.svg'
import logoOnLight from '../assets/fgg-horizontal.svg'
import { useThemeStore } from '../stores/themeStore'

type Props = {
	height: number
}

const { height } = defineProps<Props>()

const themeStore = useThemeStore()
</script>

<template>
	<img
		:src="themeStore.isDark ? logoOnDark : logoOnLight"
		alt="Favorite Game Gauntlet"
		:style="{ height: `${height}px` }"
	/>
</template>

<style scoped>
img {
	width: auto;
}
</style>

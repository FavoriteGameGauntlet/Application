<script setup lang="ts">
import logoOnDark from '../assets/fgg-horizontal-on-dark.svg'
import logoOnLight from '../assets/fgg-horizontal.svg'
import symbolOnDark from '../assets/fgg-symbol-on-dark.svg'
import symbolOnLight from '../assets/fgg-symbol.svg'
import { useThemeStore } from '../stores/themeStore'

type Props = {
	height: number
	/** only the mark, for the places too narrow for the whole logo */
	symbol?: boolean
}

const { height, symbol } = defineProps<Props>()

const themeStore = useThemeStore()
</script>

<template>
	<img
		:src="
			symbol
				? themeStore.isDark
					? symbolOnDark
					: symbolOnLight
				: themeStore.isDark
					? logoOnDark
					: logoOnLight
		"
		alt="Favorite Game Gauntlet"
		:style="{ height: `${height}px` }"
	/>
</template>

<style scoped>
img {
	width: auto;
}
</style>

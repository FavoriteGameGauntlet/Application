<script setup lang="ts">
import { computed } from 'vue'

type Props = {
	name: string
	size?: number
	color?: string
}

const { name, size = 20, color = 'currentColor' } = defineProps<Props>()

const iconUrls = import.meta.glob<string>('../../assets/icons/*.svg', {
	eager: true,
	query: '?url',
	import: 'default',
})

const iconStyle = computed(() => ({
	width: `${size}px`,
	height: `${size}px`,
	background: color,
	'--ui-icon-url': `url("${iconUrls[`../../assets/icons/${name}.svg`]}")`,
}))
</script>

<template>
	<span class="ui-icon" aria-hidden="true" :style="iconStyle"></span>
</template>

<style scoped>
.ui-icon {
	display: inline-block;
	flex: none;
	-webkit-mask: var(--ui-icon-url) center / contain no-repeat;
	mask: var(--ui-icon-url) center / contain no-repeat;
}
</style>

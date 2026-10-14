<script setup lang="ts">
import { computed } from 'vue'

type Props = {
	name?: string
	color?: string
	size?: number
	src?: string
	ring?: boolean
}

const {
	name = '',
	color = 'var(--player-1)',
	size = 40,
	src,
	ring,
} = defineProps<Props>()

const initials = computed(() =>
	name
		.split(/\s+/)
		.map((w) => w[0])
		.join('')
		.slice(0, 2)
		.toUpperCase(),
)
</script>

<template>
	<span
		class="ui-player-avatar"
		:title="name"
		:style="{ width: `${size}px`, height: `${size * 1.1}px` }"
	>
		<span v-if="ring" class="ui-player-avatar__layer" :style="{ inset: '-3px', background: color }"></span>
		<span
			class="ui-player-avatar__layer"
			:style="{ background: ring ? 'var(--surface-card)' : color }"
		></span>
		<span
			class="ui-player-avatar__layer ui-player-avatar__face"
			:style="{
				inset: ring ? '3px' : '0',
				background: src ? `center / cover url(${src})` : color,
				fontSize: `${Math.round(size * 0.36)}px`,
			}"
		>
			{{ src ? '' : initials }}
		</span>
	</span>
</template>

<style scoped>
.ui-player-avatar {
	position: relative;
	display: inline-flex;
	flex: none;
}

.ui-player-avatar__layer {
	position: absolute;
	inset: 0;
	clip-path: var(--hex-clip);
}

.ui-player-avatar__face {
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: var(--font-display);
	font-weight: 800;
	line-height: 1;
	color: var(--fgg-navy);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'

type Props = {
	name?: string
	color?: string
	size?: number
	src?: string | null
	ring?: boolean
}

const {
	name = '',
	color = 'var(--user-1)',
	size = 40,
	src,
	ring,
} = defineProps<Props>()

const failedSrc = ref<string>()
const showImage = computed(() => src && src !== failedSrc.value)

const onImageError = (event: Event) => {
	failedSrc.value =
		(event.currentTarget as HTMLImageElement).getAttribute('src') ?? undefined
}

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
		class="ui-user-avatar"
		:title="name"
		:style="{ width: `${size}px`, height: `${size * 1.1}px` }"
	>
		<span
			v-if="ring"
			class="ui-user-avatar__layer"
			:style="{ inset: '-3px', background: color }"
		></span>
		<span
			class="ui-user-avatar__layer"
			:style="{ background: ring ? 'var(--surface-card)' : color }"
		></span>
		<span
			class="ui-user-avatar__layer ui-user-avatar__face"
			:style="{
				inset: ring ? '3px' : '0',
				background: color,
				fontSize: `${Math.round(size * 0.36)}px`,
			}"
		>
			<img
				v-if="showImage && src"
				:key="src"
				:src
				alt=""
				@error="onImageError"
			/>
			<template v-else>{{ initials }}</template>
		</span>
	</span>
</template>

<style scoped>
.ui-user-avatar {
	position: relative;
	display: inline-flex;
	flex: none;
}

.ui-user-avatar__layer {
	position: absolute;
	inset: 0;
	clip-path: var(--hex-clip);
}

.ui-user-avatar__face {
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: var(--font-display);
	font-weight: 800;
	line-height: 1;
	color: var(--fgg-navy);
}

.ui-user-avatar__face img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
</style>

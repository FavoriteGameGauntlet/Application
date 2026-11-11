<script setup lang="ts">
import UiAddLink from './UiAddLink.vue'

type Props = {
	title?: string
	/** what the section is for, shown while `isEmpty` */
	empty?: string
	isEmpty?: boolean
	/** the text of the quiet "+" link under the content */
	addLabel?: string
	hint?: string
}

defineProps<Props>()

const emit = defineEmits<{ add: [] }>()
</script>

<template>
	<section class="ui-form-section">
		<div v-if="title || $slots.aside" class="ui-form-section__head">
			<h3 v-if="title" class="ui-form-section__title">{{ title }}</h3>
			<div v-if="$slots.aside" class="ui-form-section__aside">
				<slot name="aside" />
			</div>
		</div>

		<p v-if="empty && isEmpty" class="ui-form-section__note">{{ empty }}</p>

		<slot />

		<UiAddLink v-if="addLabel" @click="emit('add')">{{ addLabel }}</UiAddLink>

		<p v-if="hint" class="ui-form-section__note">{{ hint }}</p>
	</section>
</template>

<style scoped>
.ui-form-section {
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
}

.ui-form-section__head {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 24px;
}

.ui-form-section__aside {
	margin-left: auto;
}

.ui-form-section__title {
	margin: 0;
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.ui-form-section__note {
	margin: 0;
	font: var(--type-body-sm);
	color: var(--text-muted);
	text-wrap: pretty;
}
</style>

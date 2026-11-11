<script setup lang="ts">
import { onBeforeUnmount, useTemplateRef, watch } from 'vue'

import UiIconButton from './UiIconButton.vue'

type Props = {
	open?: boolean
	title?: string
	subtitle?: string
	/** the title is a name that keeps its case, not a heading in capitals */
	plainTitle?: boolean
	width?: number
	/** the dialog is a form: the footer buttons submit it, and so does Enter */
	asForm?: boolean
}

const { open = true, width = 480, asForm } = defineProps<Props>()

const emit = defineEmits<{ close: []; submit: [] }>()

const dialog = useTemplateRef<HTMLElement>('dialog')

/** Enter keeps its own meaning on a button, a link and in a textarea of the dialog */
function keepsEnter(target: EventTarget | null) {
	return (
		target instanceof Element &&
		!!dialog.value?.contains(target) &&
		!!target.closest('button, a, textarea')
	)
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		emit('close')
	} else if (
		event.key === 'Enter' &&
		asForm &&
		!event.isComposing &&
		!keepsEnter(event.target)
	) {
		// a focused field would submit the form itself, but right after opening the
		// focus is still on the button that opened the dialog
		event.preventDefault()
		emit('submit')
	}
}

watch(
	() => open,
	(isOpen) => {
		if (isOpen) window.addEventListener('keydown', onKeydown)
		else window.removeEventListener('keydown', onKeydown)
	},
	{ immediate: true },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
	<Teleport to="body">
		<div v-if="open" class="ui-dialog-overlay">
			<component
				:is="asForm ? 'form' : 'div'"
				ref="dialog"
				class="ui-dialog"
				role="dialog"
				aria-modal="true"
				:style="{ width: `${width}px` }"
				@submit.prevent="emit('submit')"
			>
				<div class="ui-dialog__head">
					<slot name="lead" />
					<div
						class="ui-dialog__titles"
						:class="{ 'ui-dialog__titles--lead': $slots.lead }"
					>
						<div
							class="ui-dialog__title"
							:class="{ 'ui-dialog__title--plain': plainTitle }"
						>
							{{ title }}
						</div>
						<div v-if="subtitle" class="ui-dialog__subtitle">
							{{ subtitle }}
						</div>
					</div>
					<UiIconButton
						type="button"
						icon="x"
						label="Закрыть"
						size="sm"
						@click="emit('close')"
					/>
				</div>
				<!-- outside the scrolling body, so the tabs stay under the title -->
				<div v-if="$slots.tabs" class="ui-dialog__tabs">
					<slot name="tabs" />
				</div>
				<div class="ui-dialog__body">
					<slot />
				</div>
				<!-- outside the scrolling body, so the actions stay in reach -->
				<div v-if="$slots.footer" class="ui-dialog__foot">
					<slot name="footer" />
				</div>
			</component>
		</div>
	</Teleport>
</template>

<style scoped>
.ui-dialog-overlay {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	background: var(--surface-overlay);
	backdrop-filter: blur(4px);
}

.ui-dialog {
	position: relative;
	display: flex;
	flex-direction: column;
	max-width: 100%;
	max-height: 100%;
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-3);
}

/* the accent notch the title hangs from */
.ui-dialog::before {
	content: '';
	position: absolute;
	top: 0;
	left: 28px;
	width: 32px;
	height: 4px;
	background: var(--accent);
	border-radius: 0 0 3px 3px;
}

.ui-dialog__head {
	flex: none;
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 26px 18px 0 28px;
}

.ui-dialog__titles {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding-top: 3px;
}

.ui-dialog__title {
	font: 800 var(--fs-20) / var(--lh-snug) var(--font-display);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
	text-wrap: balance;
}

/* a picture beside the title sits lower than the first line of text */
.ui-dialog__titles--lead {
	padding-top: 8px;
}

.ui-dialog__title--plain {
	text-transform: none;
}

.ui-dialog__subtitle {
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.ui-dialog__tabs {
	flex: none;
	margin-top: 14px;
	padding: 0 28px;
}

.ui-dialog__body {
	min-height: 0;
	overflow-y: auto;
	padding: 18px 28px 26px;
	font: var(--type-body);
	color: var(--text-body);
}

.ui-dialog__foot {
	flex: none;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	padding: 14px 20px 14px 28px;
	border-top: 1px solid var(--border-subtle);
}
</style>

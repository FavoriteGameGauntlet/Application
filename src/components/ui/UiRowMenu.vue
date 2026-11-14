<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import UiIcon from './UiIcon.vue'
import UiPopover from './UiPopover.vue'

export type RowMenuItem = {
	label: string
	icon: string
	/** red, and set apart from the items above it by a line */
	danger?: boolean
	select: () => void
}

type Props = {
	items: RowMenuItem[]
	/** the name of the button and of the menu for a screen reader */
	label?: string
	/** the button is shown but opens nothing; the label says why */
	disabled?: boolean
}

const { items, label = 'Действия', disabled } = defineProps<Props>()

const kebab = useTemplateRef<HTMLButtonElement>('kebab')
const isOpen = ref(false)

function pick(item: RowMenuItem) {
	isOpen.value = false
	item.select()
}
</script>

<template>
	<div
		class="ui-row-menu"
		:class="{ 'ui-row-menu--open': isOpen }"
		@contextmenu.prevent="isOpen = !disabled"
	>
		<slot />

		<button
			ref="kebab"
			class="ui-row-menu__kebab"
			type="button"
			:aria-label="label"
			:title="label"
			aria-haspopup="menu"
			:aria-expanded="isOpen"
			:disabled="disabled"
			@click.stop="isOpen = !isOpen"
		>
			<UiIcon name="ellipsis" :size="18" />
		</button>

		<UiPopover
			:open="isOpen"
			:anchor="kebab"
			:min-width="212"
			@close="isOpen = false"
		>
			<div role="menu" :aria-label="label" @click.stop>
				<template v-for="(item, i) in items" :key="item.label">
					<div
						v-if="item.danger && i > 0 && !items[i - 1].danger"
						class="ui-row-menu__sep"
					></div>
					<button
						class="ui-row-menu__item"
						:class="{ 'ui-row-menu__item--danger': item.danger }"
						type="button"
						role="menuitem"
						@click="pick(item)"
					>
						<UiIcon :name="item.icon" :size="16" />{{ item.label }}
					</button>
				</template>
			</div>
		</UiPopover>
	</div>
</template>

<style scoped>
/* the row keeps 60px on the right free for the button */
.ui-row-menu {
	position: relative;
}

.ui-row-menu__kebab {
	position: absolute;
	top: 50%;
	right: 16px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	margin-top: -16px;
	padding: 0;
	color: var(--text-strong);
	background: transparent;
	border: 0;
	border-radius: var(--radius-sm);
	cursor: pointer;
	opacity: 0;
}

.ui-row-menu:hover .ui-row-menu__kebab,
.ui-row-menu--open .ui-row-menu__kebab,
.ui-row-menu__kebab:focus-visible {
	opacity: 1;
}

.ui-row-menu__kebab:enabled:hover,
.ui-row-menu--open .ui-row-menu__kebab {
	background: var(--border-subtle);
}

.ui-row-menu:hover .ui-row-menu__kebab:disabled {
	color: var(--text-muted);
	cursor: not-allowed;
	opacity: 0.5;
}

.ui-row-menu__item {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	height: 40px;
	padding: 0 12px;
	font: 600 14px / 1 var(--font-body);
	text-align: left;
	color: var(--text-strong);
	background: transparent;
	border: 0;
	border-radius: var(--radius-sm);
	cursor: pointer;
}

.ui-row-menu__item:hover,
.ui-row-menu__item:focus-visible {
	background: var(--surface-sunken);
}

.ui-row-menu__item--danger {
	color: var(--danger-text);
}

.ui-row-menu__sep {
	height: 1px;
	margin: 6px 4px;
	background: var(--border-default);
}
</style>

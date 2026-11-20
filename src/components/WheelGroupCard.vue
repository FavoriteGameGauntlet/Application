<script setup lang="ts">
import { computed } from 'vue'
import type { WheelCatalogGroup } from '../api-facade/contracts'
import { useResourcesStore } from '../stores/resourcesStore'
import { formatCost } from '../utils/formatResource'
import UiSwitch from './ui/UiSwitch.vue'

/** without `editable` the card only shows the group, as the player catalogue does */
const { group, editable } = defineProps<{
	group: WheelCatalogGroup
	editable?: boolean
}>()

const emit = defineEmits<{ noRepeat: [value: boolean] }>()

const resourcesStore = useResourcesStore()

const costPills = computed(() =>
	group.cost.map((row) => formatCost(row, resourcesStore.pointTypes)),
)
</script>

<template>
	<div class="card">
		<div class="card__head">
			<slot name="name">
				<span class="card__name">{{ group.name }}</span>
			</slot>

			<UiSwitch
				v-if="!group.system"
				:model-value="group.noRepeat"
				:disabled="!editable"
				label="Не повторять применённое"
				@update:model-value="emit('noRepeat', $event)"
			/>

			<div class="card__spacer"></div>

			<slot name="actions" />
		</div>

		<div v-if="group.kind === 'changes'" class="cost">
			<span class="cost__label">Применение стоит</span>
			<span v-for="(pill, i) in costPills" :key="i" class="cost__pill">{{
				pill
			}}</span>
			<span v-if="!costPills.length" class="cost__free">бесплатно</span>
			<div class="cost__spacer"></div>
			<slot name="cost-action" />
		</div>

		<slot />
	</div>
</template>

<style scoped>
.card {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px 20px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.card__head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 16px;
	min-height: 36px;
}

.card__name {
	min-width: 0;
	font: 700 20px / 1.2 var(--font-body);
	color: var(--text-strong);
	overflow-wrap: anywhere;
}

.card__spacer {
	flex: 1;
}

.cost {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 12px;
	padding-top: 14px;
	border-top: 1px solid var(--border-subtle);
}

.cost__label {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.cost__pill {
	display: inline-flex;
	align-items: center;
	height: 26px;
	padding: 0 10px;
	font: 500 12px / 1 var(--font-body);
	color: var(--text-body);
	white-space: nowrap;
	background: var(--surface-sunken);
	border-radius: var(--radius-pill);
}

.cost__spacer {
	flex: 1;
}

.cost__free {
	font: var(--type-body-sm);
	color: var(--text-body);
}
</style>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiIconButton from '../../components/ui/UiIconButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import { useAdminSettingsStore } from '../../stores/adminSettingsStore'

const store = useAdminSettingsStore()

/** what is typed in the fields; the value is stored when the field is left */
const values = reactive<Record<string, string>>({})

const query = ref('')

const found = computed(() => {
	const q = query.value.trim().toLowerCase()

	return store.params.filter(
		(p) => !q || [p.title, p.hint, p.key].some((s) => s.toLowerCase().includes(q)),
	)
})

watch(
	() => store.params,
	(params) => {
		for (const param of params) values[param.key] = param.value
	},
)

onMounted(() => store.loadParams())
</script>

<template>
	<div class="params">
		<div class="head">
			<span class="title">Системные параметры</span>
			<div class="head__search">
				<UiInput v-model="query" compact icon="search" placeholder="Найти…" aria-label="Поиск" />
			</div>
		</div>

		<div class="table">
			<div class="table__row table__row--head">
				<span>Параметр</span>
				<span>Значение</span>
				<span>Источник</span>
				<span></span>
			</div>

			<div v-for="param in found" :key="param.key" class="table__row table__row--body">
				<div class="info">
					<span class="info__title">{{ param.title }}</span>
					<span class="info__hint">{{ param.hint }}</span>
				</div>

				<div class="value">
					<div class="value__input">
						<UiInput
							v-model="values[param.key]"
							:aria-label="param.title"
							@change="store.setParam(param, values[param.key])"
						/>
					</div>
					<span class="value__unit">{{ param.unit }}</span>
				</div>

				<span class="source">
					<UiBadge :tone="param.value !== param.default ? 'accent' : 'neutral'">
						{{ param.value !== param.default ? 'своё' : 'по умолчанию' }}
					</UiBadge>
				</span>

				<span class="reset">
					<UiIconButton
						v-if="param.value !== param.default"
						icon="rotate-ccw"
						size="sm"
						label="Сбросить к значению по умолчанию"
						@click="store.resetParam(param)"
					/>
				</span>
			</div>
		</div>

		<span class="note">
			Изменения применяются сразу. Кнопка сброса возвращает значение по умолчанию.
		</span>
	</div>
</template>

<style scoped>
.params {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
}

.head__search {
	width: 260px;
}

.title {
	font: var(--type-h2);
	letter-spacing: var(--tracking-display);
	text-transform: uppercase;
	color: var(--text-strong);
}

.table {
	overflow: hidden;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-1);
}

.table__row {
	display: grid;
	grid-template-columns: minmax(0, 2fr) 220px 140px 32px;
	gap: 16px;
	align-items: center;
	padding: 12px 16px;
}

.table__row--head {
	font: var(--type-label);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
	background: var(--surface-sunken);
}

.table__row--body {
	border-top: 1px solid var(--border-subtle);
}

.info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.info__title {
	font: 600 15px / 1.45 var(--font-body);
	color: var(--text-strong);
}

.info__hint {
	font: var(--type-caption);
	color: var(--text-muted);
}

.value {
	display: flex;
	align-items: center;
	gap: 8px;
}

.value__input {
	flex: 1;
	min-width: 0;
}

.value__unit {
	flex: none;
	width: 44px;
	font: var(--type-caption);
	color: var(--text-muted);
}

.source {
	display: flex;
}

.reset {
	display: flex;
	justify-content: flex-end;
}

.note {
	font: var(--type-body-sm);
	color: var(--text-muted);
}
</style>

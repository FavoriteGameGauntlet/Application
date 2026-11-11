<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import ColorPicker from './ColorPicker.vue'
import RowsEditor from './RowsEditor.vue'
import UiButton from './ui/UiButton.vue'
import UiCheckbox from './ui/UiCheckbox.vue'
import UiDialog from './ui/UiDialog.vue'
import UiIconButton from './ui/UiIconButton.vue'
import UiInput from './ui/UiInput.vue'
import UiSelect from './ui/UiSelect.vue'
import UiTag from './ui/UiTag.vue'
import UiTextarea from './ui/UiTextarea.vue'
import type { FormField, FormRow, FormValues } from './formDialog'

type Props = {
	open: boolean
	title: string
	fields: FormField[]
	/** values that the form opens with */
	initial: FormValues
}

const { open, fields, initial } = defineProps<Props>()

const emit = defineEmits<{ close: []; save: [values: FormValues] }>()

const texts = reactive<Record<string, string>>({})
const lists = reactive<Record<string, string[]>>({})
const flags = reactive<Record<string, boolean>>({})
const drafts = reactive<Record<string, string>>({})
const rowLists = reactive<Record<string, FormRow[]>>({})

/** the rows need more room than a single line */
const width = computed(() =>
	fields.some((f) => f.type === 'rows') ? 560 : 440,
)

watch(
	() => open,
	(isOpen) => {
		if (!isOpen) return

		for (const field of fields) {
			const value = initial[field.key]

			if (field.type === 'tags') {
				lists[field.key] = Array.isArray(value) ? [...(value as string[])] : []
				drafts[field.key] = ''
			} else if (field.type === 'check') {
				flags[field.key] = value === true
			} else if (field.type === 'rows') {
				rowLists[field.key] = Array.isArray(value)
					? (value as FormRow[]).map((row) => ({ ...row }))
					: []
			} else {
				texts[field.key] = typeof value === 'string' ? value : ''
			}
		}
	},
	{ immediate: true },
)

const addTag = (key: string) => {
	const tag = drafts[key]?.trim()

	if (!tag) return

	lists[key].push(tag)
	drafts[key] = ''
}

const onSubmit = () => {
	const values: FormValues = {}

	for (const field of fields) {
		if (field.type === 'tags') {
			addTag(field.key)
			values[field.key] = [...lists[field.key]]
		} else if (field.type === 'check') {
			values[field.key] = flags[field.key]
		} else if (field.type === 'rows') {
			values[field.key] = rowLists[field.key].map((row) => ({ ...row }))
		} else {
			values[field.key] = texts[field.key]
		}
	}

	emit('save', values)
}
</script>

<template>
	<UiDialog :open :title :width="width" @close="emit('close')">
		<form class="form" @submit.prevent="onSubmit">
			<div class="form__fields">
				<template v-for="field in fields" :key="field.key">
					<div v-if="field.type === 'check'" class="check">
						<UiCheckbox v-model="flags[field.key]" :label="field.label" />
						<span class="note check__hint">{{ field.hint }}</span>
					</div>

					<div v-else-if="field.type === 'note'" class="tags">
						<span class="tags__label">{{ field.label }}</span>
						<span class="note">{{ field.hint }}</span>
					</div>

					<ColorPicker
						v-else-if="field.type === 'color'"
						v-model="texts[field.key]"
						:label="field.label"
						:hint="field.hint"
					/>

					<RowsEditor
						v-else-if="field.type === 'rows'"
						v-model="rowLists[field.key]"
						:variant="field.variant ?? 'change'"
						:label="field.label"
						:hint="field.hint"
					/>

					<div v-else-if="field.type === 'tags'" class="tags">
						<span class="tags__label">{{ field.label }}</span>
						<div v-if="lists[field.key]?.length" class="tags__chips">
							<UiTag
								v-for="(tag, i) in lists[field.key]"
								:key="i"
								removable
								@remove="lists[field.key].splice(i, 1)"
							>
								{{ tag }}
							</UiTag>
						</div>
						<div class="tags__draft">
							<UiInput
								v-model="drafts[field.key]"
								:placeholder="field.placeholder"
								@keydown.enter.prevent="addTag(field.key)"
							/>
							<UiIconButton
								type="button"
								icon="plus"
								variant="outline"
								size="lg"
								label="Добавить изменение"
								style="--ui-icon-button-d: 44px"
								@click="addTag(field.key)"
							/>
						</div>
						<span class="note">{{ field.hint }}</span>
					</div>

					<UiTextarea
						v-else-if="field.type === 'area'"
						v-model="texts[field.key]"
						:label="field.label"
						:placeholder="field.placeholder"
						:hint="field.hint"
					/>

					<UiSelect
						v-else-if="field.type === 'select'"
						v-model="texts[field.key]"
						:label="field.label"
						:options="field.options"
						:hint="field.hint"
					/>

					<UiInput
						v-else
						v-model="texts[field.key]"
						:label="field.label"
						:placeholder="field.placeholder"
						:hint="field.hint"
					/>
				</template>
			</div>

			<div class="form__actions">
				<UiButton type="button" variant="outline" @click="emit('close')"
					>Отмена</UiButton
				>
				<UiButton type="submit" icon="check">Сохранить</UiButton>
			</div>
		</form>
	</UiDialog>
</template>

<style scoped>
.form {
	display: flex;
	flex-direction: column;
	gap: 20px;
	margin: 0;
}

.form__fields {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

/* a long form scrolls under the buttons, they stay in reach */
.form__actions {
	position: sticky;
	bottom: -24px;
	z-index: 1;
	display: flex;
	gap: 8px;
	justify-content: flex-end;
	margin: 0 -24px -24px;
	padding: 12px 24px 24px;
	background: var(--surface-card);
}

.check {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.check__hint {
	padding-left: 30px;
}

.tags {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.tags__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.tags__chips {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.tags__draft {
	display: flex;
	gap: 8px;
	align-items: center;
}

.tags__draft > :first-child {
	flex: 1;
	min-width: 0;
}

.note {
	font: var(--type-caption);
	color: var(--text-muted);
}
</style>

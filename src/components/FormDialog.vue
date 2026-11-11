<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import ColorPicker from './ColorPicker.vue'
import RowsEditor from './RowsEditor.vue'
import UiAddLink from './ui/UiAddLink.vue'
import UiButton from './ui/UiButton.vue'
import UiChoiceChips from './ui/UiChoiceChips.vue'
import UiDateRange from './ui/UiDateRange.vue'
import UiDialog from './ui/UiDialog.vue'
import UiField from './ui/UiField.vue'
import UiFormSection from './ui/UiFormSection.vue'
import UiIcon from './ui/UiIcon.vue'
import UiIconButton from './ui/UiIconButton.vue'
import UiInput from './ui/UiInput.vue'
import UiPickChips from './ui/UiPickChips.vue'
import UiPicker from './ui/UiPicker.vue'
import UiSegmented from './ui/UiSegmented.vue'
import UiSpanInput from './ui/UiSpanInput.vue'
import UiSwitch from './ui/UiSwitch.vue'
import UiTabs from './ui/UiTabs.vue'
import UiTag from './ui/UiTag.vue'
import UiTextarea from './ui/UiTextarea.vue'
import type {
	FormField,
	FormRow,
	FormSection,
	FormTab,
	FormValues,
} from './formDialog'

type Props = {
	open: boolean
	title: string
	/** the line under the title */
	subtitle?: string
	/** the title is a name that keeps its case, not a heading in capitals */
	plainTitle?: boolean
	sections: FormSection[]
	tabs?: FormTab[]
	/** values that the form opens with */
	initial: FormValues
	/** the text of the main button */
	submitLabel?: string
	/** the width in px; by default the rows and the columns get more room than a single line */
	width?: number
}

const {
	open,
	sections,
	tabs = [],
	initial,
	submitLabel = 'Сохранить',
	width: fixedWidth,
} = defineProps<Props>()

const emit = defineEmits<{ close: []; save: [values: FormValues] }>()

const texts = reactive<Record<string, string>>({})
const lists = reactive<Record<string, string[]>>({})
const flags = reactive<Record<string, boolean>>({})
const drafts = reactive<Record<string, string>>({})
const rowLists = reactive<Record<string, FormRow[]>>({})
/** the optional fields that are unfolded */
const unfolded = reactive<Record<string, boolean>>({})
/** the elements of the unfolded fields, to put the focus into the one just asked for */
const fieldEls: Record<string, HTMLElement | null> = {}

const allFields = computed(() =>
	sections.flatMap((s) => (s.aside ? [s.aside, ...s.fields] : s.fields)),
)

/** the rows and the columns need more room than a single line */
const dialogWidth = computed(
	() =>
		fixedWidth ??
		(allFields.value.some((f) => f.type === 'rows') ||
		sections.some((s) => s.columns)
			? 620
			: 440),
)

const isListType = (field: FormField) =>
	field.type === 'tags' || field.type === 'chips'

watch(
	() => open,
	(isOpen) => {
		if (!isOpen) return

		chosenTab.value = ''

		for (const field of allFields.value) {
			if (field.type === 'arrow') continue

			const value = initial[field.key]

			if (isListType(field)) {
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
				unfolded[field.key] = !field.optional || texts[field.key] !== ''
			}
		}
	},
	{ immediate: true },
)

const unfold = async (field: FormField) => {
	unfolded[field.key] = true
	await nextTick()
	fieldEls[field.key]?.querySelector<HTMLElement>('input, textarea')?.focus()
}

const addTag = (key: string) => {
	const tag = drafts[key]?.trim()

	if (!tag) return

	lists[key].push(tag)
	drafts[key] = ''
}

/** a `check` field holds a flag, any other field holds a string */
const holds = (when: NonNullable<FormField['when']>) =>
	(when.key in flags ? flags[when.key] : texts[when.key]) === when.is

const isShown = (field: FormField) => !field.when || holds(field.when)

const visibleTabs = computed(() => tabs.filter((t) => !t.when || holds(t.when)))

const chosenTab = ref('')

/** the tab that is open; the first one when the chosen one is gone */
const currentTab = computed(() =>
	visibleTabs.value.some((t) => t.key === chosenTab.value)
		? chosenTab.value
		: visibleTabs.value[0]?.key,
)

const tabOf = (section: FormSection) => section.tab ?? tabs[0]?.key

/** the sections of a tab that is not shown count as absent */
const inShownTab = (section: FormSection) =>
	!tabs.length || visibleTabs.value.some((t) => t.key === tabOf(section))

const isSectionShown = (section: FormSection) =>
	(!tabs.length || tabOf(section) === currentTab.value) &&
	(!!section.aside || section.fields.some(isShown))

const isFilled = (field: FormField) => {
	if (field.type === 'rows') return !!rowLists[field.key]?.length
	if (isListType(field)) return !!lists[field.key]?.length

	return !!texts[field.key]?.trim()
}

/** «название», «название и действие», «название, цель и действие» */
const joinNouns = (nouns: string[]) =>
	nouns.length > 1
		? `${nouns.slice(0, -1).join(', ')} и ${nouns[nouns.length - 1]}`
		: nouns[0]

const missingIn = (inSections: FormSection[]) =>
	inSections
		.filter(inShownTab)
		.flatMap((s) => (s.aside ? [s.aside, ...s.fields] : s.fields))
		.filter((f) => f.required && isShown(f) && !isFilled(f))
		.map((f) => f.required as string)

const missing = computed(() => missingIn(sections))

/** the tabs with something still to fill, as the bar shows them */
const tabItems = computed(() =>
	visibleTabs.value.map((t) => ({
		value: t.key,
		label: t.label,
		locked: t.locked,
		mark: missingIn(sections.filter((s) => tabOf(s) === t.key)).length > 0,
	})),
)

const why = computed(() =>
	missing.value.length
		? `${missing.value.length > 1 ? 'Нужны' : 'Нужно'} ${joinNouns(missing.value)}`
		: '',
)

const onSubmit = () => {
	// Enter submits the dialog as well, whatever the state of the button
	if (missing.value.length) return

	const values: FormValues = {}

	for (const field of allFields.value) {
		if (field.type === 'arrow') continue

		if (field.type === 'tags') {
			addTag(field.key)
			values[field.key] = [...lists[field.key]]
		} else if (field.type === 'chips') {
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

const groupsOf = (field: FormField) => [{ options: field.options ?? [] }]
</script>

<template>
	<UiDialog
		:open
		:title
		:subtitle
		:plain-title
		:width="dialogWidth"
		as-form
		@close="emit('close')"
		@submit="onSubmit"
	>
		<template v-if="$slots.lead" #lead>
			<slot name="lead" />
		</template>

		<template v-if="visibleTabs.length > 1" #tabs>
			<UiTabs
				:model-value="currentTab"
				:items="tabItems"
				compact
				@update:model-value="chosenTab = $event ?? ''"
			/>
		</template>

		<div class="form__sections">
			<template v-for="(section, i) in sections" :key="i">
				<UiFormSection v-if="isSectionShown(section)" :title="section.title">
					<template v-if="section.aside" #aside>
						<UiSegmented
							v-model="texts[section.aside.key]"
							:options="section.aside.options ?? []"
							:label="section.aside.label"
						/>
					</template>

					<div
						class="form__fields"
						:class="{ 'form__fields--columns': section.columns }"
						:style="{ gridTemplateColumns: section.columns }"
					>
						<template v-for="field in section.fields" :key="field.key">
							<div
								v-if="isShown(field)"
								class="form__cell"
								:class="{ 'form__cell--placed': field.column }"
								:style="{ gridColumn: field.column }"
							>
								<div v-if="field.type === 'arrow'" class="form__arrow">
									<UiIcon name="arrow-left-right" :size="18" />
								</div>

								<UiDateRange
									v-else-if="field.type === 'dates'"
									v-model="texts[field.key]"
									:label="field.label"
									:hint="field.hint"
								/>

								<div
									v-else-if="field.type === 'check'"
									class="form__check"
									:style="{ width: field.width && `${field.width}px` }"
								>
									<UiSwitch v-model="flags[field.key]" :label="field.label" />
									<span v-if="field.hint" class="form__note form__check-hint">{{
										field.hint
									}}</span>
								</div>

								<div v-else-if="field.type === 'note'" class="form__tags">
									<span v-if="field.label" class="form__label">{{
										field.label
									}}</span>
									<span class="form__note">{{ field.hint }}</span>
								</div>

								<div v-else-if="field.type === 'locked'" class="form__locked">
									<p v-for="(line, j) in field.lines" :key="j">{{ line }}</p>
								</div>

								<UiField
									v-else-if="field.type === 'span'"
									group
									:label="field.label"
									:sub="!!section.columns"
									:hint="field.hint"
								>
									<UiSpanInput
										v-model="texts[field.key]"
										:label="field.label"
									/>
								</UiField>

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
									:empty="field.empty"
									:add-label="field.addLabel"
								/>

								<UiField
									v-else-if="field.type === 'chips'"
									group
									:label="field.label"
									:hint="field.hint"
								>
									<UiPickChips
										v-model="lists[field.key]"
										:options="field.options ?? []"
										:add-label="field.addLabel ?? 'Добавить'"
										:label="field.label"
									/>
								</UiField>

								<UiField
									v-else-if="field.type === 'choice'"
									group
									:label="field.label"
									:hint="field.hint"
								>
									<UiChoiceChips
										v-model="texts[field.key]"
										:options="field.options ?? []"
										:label="field.label"
									/>
								</UiField>

								<div v-else-if="field.type === 'tags'" class="form__tags">
									<span class="form__label">{{ field.label }}</span>
									<div v-if="lists[field.key]?.length" class="form__chips">
										<UiTag
											v-for="(tag, j) in lists[field.key]"
											:key="j"
											removable
											@remove="lists[field.key].splice(j, 1)"
										>
											{{ tag }}
										</UiTag>
									</div>
									<div class="form__draft">
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
									<span class="form__note">{{ field.hint }}</span>
								</div>

								<UiAddLink
									v-else-if="!unfolded[field.key]"
									class="form__fold"
									@click="unfold(field)"
									>{{ field.label }}</UiAddLink
								>

								<div
									v-else
									:ref="
										(el) => (fieldEls[field.key] = el as HTMLElement | null)
									"
									class="form__field"
									:style="{ width: field.width && `${field.width}px` }"
								>
									<UiTextarea
										v-if="field.type === 'area'"
										v-model="texts[field.key]"
										:label="field.label"
										:placeholder="field.placeholder"
										:hint="field.hint"
									/>

									<UiPicker
										v-else-if="field.type === 'select'"
										v-model="texts[field.key]"
										:label="field.label"
										:sub="!!section.columns"
										:groups="groupsOf(field)"
										:hint="field.hint"
									/>

									<UiInput
										v-else
										v-model="texts[field.key]"
										:label="field.label"
										:sub="!!section.columns"
										:numeric="field.numeric"
										:placeholder="field.placeholder"
										:hint="field.hint"
									/>
								</div>
							</div>
						</template>
					</div>
				</UiFormSection>
			</template>
		</div>

		<template #footer>
			<span class="form__why">{{ why }}</span>
			<UiButton type="button" variant="ghost" @click="emit('close')"
				>Отмена</UiButton
			>
			<UiButton type="submit" :disabled="missing.length > 0">{{
				submitLabel
			}}</UiButton>
		</template>
	</UiDialog>
</template>

<style scoped>
.form__sections {
	display: flex;
	flex-direction: column;
	gap: 22px;
}

.form__fields {
	display: flex;
	flex-direction: column;
	gap: 22px;
}

.form__fields--columns {
	display: grid;
	align-items: start;
	gap: 16px;
}

/* a cell is no box of its own, unless the field asks for a column */
.form__cell {
	display: contents;
}

.form__cell--placed {
	display: block;
	min-width: 0;
}

/* level with the first row of the rows next to it, under their title */
.form__arrow {
	display: flex;
	justify-content: center;
	padding-top: 54px;
	color: var(--text-muted);
}

/* the link takes the place of a field: the gap above it is for fields */
.form__fold {
	margin-top: -14px;
}

.form__field {
	min-width: 0;
}

.form__why {
	flex: 1;
	min-width: 0;
	font: var(--type-body-sm);
	color: var(--text-muted);
}

.form__check {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.form__check-hint {
	padding-left: 50px;
}

.form__tags {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.form__locked {
	display: flex;
	flex-direction: column;
	gap: 4px;
	font: var(--type-body);
	color: var(--text-body);
}

.form__locked p {
	margin: 0;
}

.form__label {
	font: 700 12px / 1 var(--font-display);
	letter-spacing: var(--tracking-label);
	text-transform: uppercase;
	color: var(--text-muted);
}

.form__chips {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.form__draft {
	display: flex;
	gap: 8px;
	align-items: center;
}

.form__draft > :first-child {
	flex: 1;
	min-width: 0;
}

.form__note {
	font: var(--type-caption);
	color: var(--text-muted);
}
</style>

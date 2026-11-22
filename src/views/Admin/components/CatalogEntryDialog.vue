<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
	CatalogEntry,
	CatalogEntryInput,
	CatalogKind,
} from '../../../api-facade/contracts'
import type {
	FormCheck,
	FormField,
	FormRow,
	FormSection,
	FormTab,
	FormValues,
	TriggerFormRow,
} from '../../../components/formDialog'
import FormDialog from '../../../components/FormDialog.vue'
import { useAdminCatalogStore } from '../../../stores/adminCatalogStore'
import { applyModeOptions } from '../../../utils/applyMode'
import { formatSpanExact, parseSpan } from '../../../utils/format'
import { itemConditionLabels } from '../../../utils/itemCondition'
import { actsOnChosen } from '../../../utils/itemUse'
import {
	itemEntriesToForm,
	modifiersToForm,
	parsedRows,
	parseItemEntries,
	parseModifiers,
	parseTriggers,
	problemOf,
	triggersToForm,
} from '../../../utils/formRows'
import type {
	ApplyMode,
	ItemCondition,
	ItemEntryRow,
	PerkAbility,
} from '../../../api-facade/contracts'

type Props = {
	open: boolean
	kind: CatalogKind
	/** undefined is a new entry */
	entry?: CatalogEntry
	/** the page decides whether a new point type is shared; it cannot change later */
	shared?: boolean
}

const { open, kind, entry, shared = false } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const store = useAdminCatalogStore()

const textOf = (values: FormValues, key: string) =>
	String(values[key] ?? '').trim()

/** the whole number typed into the field, undefined while it is empty, NaN for anything else */
const numberOf = (values: FormValues, key: string) => {
	const text = textOf(values, key)

	if (text === '') return undefined

	const number = Number(text)

	return Number.isInteger(number) ? number : NaN
}

/** a field that is either empty or a whole number of at least `min` */
const wholeCheck =
	(need: string, min = -Infinity) =>
	(values: FormValues, key: string) => {
		const number = numberOf(values, key)

		return number !== undefined && !(number >= min) ? { text: need } : undefined
	}

const wholeField = (
	field: Omit<FormField, 'check'>,
	need: string,
	min?: number,
): FormField => ({
	...field,
	numeric: true,
	check: (values) => wholeCheck(need, min)(values, field.key),
})

const rowsOf = (values: FormValues, key: string) =>
	(values[key] as FormRow[] | undefined) ?? []

/** the time of a renewal is at most ten years */
const MAX_RENEWAL = 315_360_000

const adds: Record<CatalogKind, string> = {
	'point-types': 'Новый тип очков',
	items: 'Новый предмет',
	effects: 'Новый эффект',
	perks: 'Новый перк',
}

/** a chip per length that is asked for most; `custom` opens a line for the rest */
const durationPresets = [
	{ value: 'none', label: 'Пока не снимут' },
	{ value: '3600', label: '1 час' },
	{ value: '86400', label: '1 день' },
	{ value: '259200', label: '3 дня' },
	{ value: '604800', label: 'Неделя' },
	{ value: 'custom', label: 'Своё' },
]

const columns = (count: number) => `repeat(${count}, minmax(0, 1fr))`

/** without rows there is nothing to pick from, so the change applies in full: a pick mode would refuse every use */
const hasEntries = ref(false)
const hasAbilityEntries = ref(false)

const applies = (key: string, hasRows: boolean): FormField => ({
	key,
	type: 'segment',
	label: 'Что применяется',
	options: applyModeOptions,
	...(!hasRows && { forced: 'all' }),
})

const sections = computed<FormSection[]>(() => {
	const common: FormField[] = [
		{
			key: 'name',
			label: 'Название',
			required: 'название',
			placeholder: {
				'point-types': 'Билеты',
				items: 'Свиток удачи',
				effects: 'Проклятие',
				perks: 'Везунчик',
			}[kind],
		},
		{
			key: 'description',
			label: 'Описание',
			type: 'area',
			optional: true,
			placeholder: 'Что это и зачем — так увидят игроки',
		},
	]

	switch (kind) {
		case 'point-types':
			return [
				{ fields: common },
				{
					title: 'Формы единиц',
					columns: columns(3),
					fields: [
						{
							key: 'unit1',
							label: 'Для 1',
							placeholder: 'билет',
							required: 'формы единиц',
						},
						{
							key: 'unit2',
							label: 'Для 2–4',
							placeholder: 'билета',
							required: 'формы единиц',
						},
						{
							key: 'unit5',
							label: 'Для 5 и больше',
							placeholder: 'билетов',
							required: 'формы единиц',
						},
					],
				},
				{
					title: 'Правила',
					columns: columns(2),
					fields: [
						{
							key: 'visibility',
							label: 'Кто видит',
							type: 'select',
							options: [
								{ value: 'all', label: 'Все игроки' },
								{ value: 'admins', label: 'Только админы' },
							],
						},
					],
				},
				{
					columns: columns(3),
					fields: [
						wholeField(
							{
								key: 'startValue',
								label: 'Начальное значение',
								placeholder: '0',
							},
							'Начальное значение должно быть целым',
						),
						wholeField(
							{ key: 'minimum', label: 'Минимум', placeholder: 'Без лимита' },
							'Минимум должен быть целым',
						),
						wholeField(
							{ key: 'maximum', label: 'Максимум', placeholder: 'Без лимита' },
							'Максимум должен быть целым',
						),
					],
				},
			]
		case 'items':
			return [
				{
					fields: [
						...common,
						{
							key: 'entries',
							label: 'При использовании',
							type: 'rows',
							variant: 'item-entry',
							empty:
								'Что произойдёт, когда игрок применит предмет. Например: владелец получает 10 золота.',
							addLabel: 'Действие',
							aside: applies('applies', hasEntries.value),
							check: (values) =>
								problemOf(parseItemEntries(rowsOf(values, 'entries'))),
						},
						{
							key: 'isManualChange',
							type: 'check',
							label: 'Потом ручное изменение',
						},
						wholeField(
							{
								key: 'usesMax',
								label: 'Количество использований',
								width: 120,
								placeholder: '1',
								required: 'количество использований',
							},
							'Количество использований должно быть целым и больше нуля',
							1,
						),
						{
							key: 'conditions',
							label: 'Условия',
							type: 'chips',
							options: (
								Object.keys(itemConditionLabels) as ItemCondition[]
							).map((c) => ({ value: c, ...itemConditionLabels[c] })),
							addLabel: 'Условие',
							check: (values) => {
								const conditions = values.conditions as ItemCondition[]

								return conditions.includes('target_online') &&
									conditions.includes('target_offline')
									? {
											text: 'Условие должно быть одно: «Цель в сети» или «Цель не в сети»',
										}
									: undefined
							},
						},
					],
				},
			]
		case 'effects':
			return [
				{
					fields: [
						...common,
						{
							key: 'modifiers',
							label: 'Пока действует',
							type: 'rows',
							variant: 'modifier',
							empty:
								'Очки, которые меняются сами, пока эффект активен. Можно оставить пустым.',
							addLabel: 'Изменение очков',
							check: (values) =>
								problemOf(parseModifiers(rowsOf(values, 'modifiers'))),
						},
						{
							key: 'durationPreset',
							label: 'Сколько действует',
							type: 'choice',
							options: durationPresets,
						},
						{
							key: 'duration',
							label: 'Длительность',
							placeholder: '2 ч 30 м',
							required: 'длительность',
							when: { key: 'durationPreset', is: 'custom' },
							check: (values) =>
								parseSpan(textOf(values, 'duration')) === undefined
									? {
											text: 'Длительность должна быть вида «2 ч» или «1 д»',
										}
									: undefined,
						},
					],
				},
			]
		default: {
			const modifiers: FormField = {
				key: 'modifiers',
				label: 'Пока перк у игрока',
				type: 'rows',
				variant: 'modifier',
				empty: 'Очки, которые перк меняет сам. Можно оставить пустым.',
				addLabel: 'Изменение очков',
				check: (values) =>
					problemOf(parseModifiers(rowsOf(values, 'modifiers'))),
			}

			const perkFields = [...common, modifiers]

			const limited = { key: 'abilityLimit', is: 'limited' }

			return [
				{
					tab: 'perk',
					fields: [
						...perkFields,
						{
							key: 'abilityOn',
							type: 'check',
							label: 'Активируемая способность',
						},
					],
				},
				{
					tab: 'ability',
					fields: [
						{
							key: 'abilityEntries',
							label: 'Когда игрок применяет',
							type: 'rows',
							variant: 'item-entry',
							addLabel: 'Действие',
							aside: applies('abilityApplies', hasAbilityEntries.value),
							check: (values) =>
								problemOf(parseItemEntries(rowsOf(values, 'abilityEntries'))),
						},
						{
							key: 'abilityIsManualChange',
							type: 'check',
							label: 'Потом ручное изменение',
						},
					],
				},
				{
					tab: 'ability',
					title: 'Сколько раз',
					columns: '96px 156px minmax(0, 1fr)',
					aside: {
						key: 'abilityLimit',
						type: 'segment',
						label: 'Сколько раз',
						options: [
							{ value: 'unlimited', label: 'Сколько угодно' },
							{ value: 'limited', label: 'С лимитом' },
						],
					},
					fields: [
						wholeField(
							{
								key: 'abilityUsesMax',
								label: 'Максимум',
								required: 'максимум использований',
								when: limited,
							},
							'Максимум использований должен быть целым, от 1',
							1,
						),
						wholeField(
							{
								key: 'abilityUsesStart',
								label: 'У нового владельца',
								required: 'использования у нового владельца',
								when: limited,
							},
							'Использования у нового владельца должны быть целым числом от 0',
							0,
						),
						{
							key: 'abilityRenewal',
							label: 'Полное восстановление раз в',
							type: 'span',
							when: limited,
							check: (values) => {
								const seconds = numberOf(values, 'abilityRenewal')

								return seconds !== undefined &&
									!(seconds >= 1 && seconds <= MAX_RENEWAL)
									? {
											text: 'Восстановление должно быть целым сроком до 10 лет',
										}
									: undefined
							},
						},
					],
				},
				{
					tab: 'ability',
					title: 'Заряды',
					columns: '200px',
					fields: [
						wholeField(
							{
								key: 'abilityCharges',
								label: 'На одно использование',
								placeholder: '0',
								when: limited,
							},
							'Заряды должны быть целым числом от 0',
							0,
						),
					],
				},
				{
					tab: 'ability',
					fields: [
						{
							key: 'abilityTriggers',
							label: 'Триггеры',
							type: 'triggers',
							addLabel: 'Триггер',
							when: limited,
						},
					],
				},
			]
		}
	}
})

const tabs = computed<FormTab[] | undefined>(() => {
	if (kind !== 'perks') return undefined

	const perk = { key: 'perk', label: 'Перк' }

	return [
		perk,
		{
			key: 'ability',
			label: 'Способность',
			when: { key: 'abilityOn', is: true },
		},
	]
})

/** the preset that holds the length of the effect, or `custom` for a length without a chip */
const durationPresetOf = (duration: number | null | undefined) => {
	if (duration == null) return 'none'

	return durationPresets.some((p) => p.value === String(duration))
		? String(duration)
		: 'custom'
}

const initial = computed<FormValues>(() => ({
	name: entry?.name ?? '',
	description: entry?.description ?? '',
	unit1: entry?.unitForms?.one ?? '',
	unit2: entry?.unitForms?.several ?? '',
	unit5: entry?.unitForms?.many ?? '',
	entries: itemEntriesToForm(entry?.entries ?? []),
	applies: entry?.applyMode ?? 'all',
	isManualChange: entry?.isManualChange ?? false,
	conditions: [...(entry?.conditions ?? [])],
	modifiers: modifiersToForm(entry?.modifiers ?? []),
	abilityEntries: itemEntriesToForm(entry?.ability?.entries ?? []),
	abilityApplies: entry?.ability?.applyMode ?? 'all',
	abilityIsManualChange: entry?.ability?.isManualChange ?? false,
	abilityUsesMax: entry?.ability?.uses ? String(entry.ability.uses.max) : '',
	abilityUsesStart: entry?.ability?.uses
		? String(entry.ability.uses.start)
		: '',
	abilityCharges: entry?.ability ? String(entry.ability.chargesMax) : '',
	abilityTriggers: triggersToForm(entry?.ability?.triggers ?? []),
	abilityRenewal: entry?.ability?.renewalPeriod
		? String(entry.ability.renewalPeriod)
		: '',
	abilityOn: entry ? !!entry.ability : false,
	abilityLimit: entry?.ability?.uses ? 'limited' : 'unlimited',
	durationPreset: durationPresetOf(entry?.duration),
	duration: entry?.duration ? formatSpanExact(entry.duration) : '',
	usesMax: entry?.usesMax != null ? String(entry.usesMax) : entry ? '' : '1',
	startValue: entry?.startValue != null ? String(entry.startValue) : '',
	minimum: entry?.minimum != null ? String(entry.minimum) : '',
	maximum: entry?.maximum != null ? String(entry.maximum) : '',
	visibility: entry?.isPublic === false ? 'admins' : 'all',
}))

const title = computed(() => (entry ? `Изменить «${entry.name}»` : adds[kind]))

const submitLabel = computed(() => (entry ? 'Сохранить' : 'Создать'))

/** the rules that compare fields; each speaks only once its fields hold whole numbers */
const checks = computed<FormCheck[]>(() => {
	switch (kind) {
		case 'point-types':
			return [
				{
					fields: ['minimum', 'maximum'],
					check: (values) => {
						const min = numberOf(values, 'minimum')
						const max = numberOf(values, 'maximum')

						return min !== undefined && max !== undefined && min > max
							? 'Минимум должен быть не больше максимума'
							: undefined
					},
				},
				{
					fields: ['startValue'],
					check: (values) => {
						const start = numberOf(values, 'startValue') ?? 0
						const min = numberOf(values, 'minimum')
						const max = numberOf(values, 'maximum')

						return (min !== undefined && start < min) ||
							(max !== undefined && start > max)
							? 'Начальное значение должно быть между минимумом и максимумом'
							: undefined
					},
				},
			]
		case 'items':
			return [
				{
					fields: ['conditions', 'entries'],
					check: (values) =>
						(values.conditions as ItemCondition[]).some((c) =>
							c.startsWith('target_'),
						) && !rowsOf(values, 'entries').some(actsOnChosen)
							? 'Для условий про цели должна быть строка с выбранным игроком'
							: undefined,
				},
			]
		case 'perks':
			return [
				{
					fields: ['abilityCharges', 'abilityTriggers'],
					check: (values) =>
						!numberOf(values, 'abilityCharges') && triggersOf(values).length > 0
							? 'Зарядов на одно использование должно быть больше нуля: их меняют триггеры'
							: undefined,
				},
				{
					fields: ['abilityTriggers'],
					check: (values) =>
						(numberOf(values, 'abilityCharges') ?? 0) > 0 &&
						!triggersOf(values).some((t) => t.action === 'add_charge')
							? 'Должен быть триггер «Добавляет заряд»: без него заряды не копятся'
							: undefined,
				},
			]
		default:
			return []
	}
})

const triggersOf = (values: FormValues) =>
	(values.abilityTriggers as TriggerFormRow[] | undefined) ?? []

/** the ability the form describes, null for a perk without one */
const abilityOf = (values: FormValues): PerkAbility | null => {
	if (values.abilityOn !== true) return null

	const applyMode = textOf(values, 'abilityApplies') as ApplyMode
	const isManualChange = values.abilityIsManualChange === true
	const entries: ItemEntryRow[] = parsedRows(
		parseItemEntries(rowsOf(values, 'abilityEntries')),
	)

	// without a limit there are no charges and no renewal
	if (textOf(values, 'abilityLimit') !== 'limited') {
		return { applyMode, isManualChange, entries, chargesMax: 0, triggers: [] }
	}

	const renewalPeriod = numberOf(values, 'abilityRenewal')

	return {
		applyMode,
		isManualChange,
		entries,
		uses: {
			max: Number(textOf(values, 'abilityUsesMax')),
			start: Number(textOf(values, 'abilityUsesStart')),
		},
		chargesMax: numberOf(values, 'abilityCharges') ?? 0,
		...(renewalPeriod !== undefined && { renewalPeriod }),
		triggers: parseTriggers(triggersOf(values)),
	}
}

const onChange = (values: FormValues) => {
	hasEntries.value = rowsOf(values, 'entries').length > 0
	hasAbilityEntries.value = rowsOf(values, 'abilityEntries').length > 0
}

const onSave = async (values: FormValues) => {
	const input: CatalogEntryInput = {
		name: textOf(values, 'name'),
		description: textOf(values, 'description'),
	}

	if (kind === 'point-types') {
		input.unitForms = {
			one: textOf(values, 'unit1'),
			several: textOf(values, 'unit2'),
			many: textOf(values, 'unit5'),
		}
		input.startValue = numberOf(values, 'startValue') ?? 0
		input.minimum = numberOf(values, 'minimum') ?? null
		input.maximum = numberOf(values, 'maximum') ?? null
		input.isPublic = textOf(values, 'visibility') !== 'admins'

		if (!entry) input.isShared = shared
	}

	if (kind === 'items') {
		input.entries = parsedRows(parseItemEntries(rowsOf(values, 'entries')))
		input.applyMode = textOf(values, 'applies') as ApplyMode
		input.isManualChange = values.isManualChange === true
		input.usesMax = Number(textOf(values, 'usesMax'))
		input.conditions = values.conditions as ItemCondition[]
	}

	if (kind === 'effects' || kind === 'perks') {
		input.modifiers = parsedRows(parseModifiers(rowsOf(values, 'modifiers')))
	}

	if (kind === 'effects') {
		const preset = textOf(values, 'durationPreset')

		input.duration =
			preset === 'none'
				? null
				: preset === 'custom'
					? (parseSpan(textOf(values, 'duration')) ?? null)
					: Number(preset)
	}

	if (kind === 'perks') {
		const ability = abilityOf(values)

		// a saved ability resets the uses and charges of every holder, so an
		// existing perk sends it only when the admin changed it
		if (
			!entry ||
			JSON.stringify(ability) !== JSON.stringify(abilityOf(initial.value))
		)
			input.ability = ability
	}

	if (await store.saveEntry(kind, entry?.id, input)) emit('close')
}
</script>

<template>
	<FormDialog
		:open
		:title
		:sections
		:tabs
		:checks
		:initial
		:submit-label
		:width="kind === 'perks' ? 680 : undefined"
		@close="emit('close')"
		@change="onChange"
		@save="onSave"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
	CatalogEntry,
	CatalogEntryInput,
	CatalogKind,
} from '../../../api-facade/contracts'
import type {
	FormField,
	FormRow,
	FormSection,
	FormTab,
	FormValues,
} from '../../../components/formDialog'
import FormDialog from '../../../components/FormDialog.vue'
import { useAdminCatalogStore } from '../../../stores/adminCatalogStore'
import { useToastStore } from '../../../stores/toastStore'
import { formatSpanExact, parseSpan } from '../../../utils/format'
import {
	itemEntriesToForm,
	modifiersToForm,
	parseItemEntries,
	parseModifiers,
} from '../../../utils/formRows'
import type {
	ItemCondition,
	ItemEntryRow,
	PerkAbility,
} from '../../../api-facade/contracts'

type Props = {
	open: boolean
	kind: CatalogKind
	/** undefined is a new entry */
	entry?: CatalogEntry
	/** a new point type is created shared by default */
	shared?: boolean
}

const { open, kind, entry, shared = false } = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const store = useAdminCatalogStore()
const toastStore = useToastStore()

const adds: Record<CatalogKind, string> = {
	'point-types': 'Новый тип очков',
	items: 'Новый предмет',
	effects: 'Новый эффект',
	perks: 'Новый перк',
}

const creates: Record<CatalogKind, string> = {
	'point-types': 'Создать тип очков',
	items: 'Создать предмет',
	effects: 'Создать эффект',
	perks: 'Создать перк',
}

const conditionLabels: Record<ItemCondition, { label: string; hint: string }> =
	{
		target_not_self: {
			label: 'Не на себя',
			hint: 'Цель — не тот, кто использует',
		},
		target_online: { label: 'Цель в сети', hint: 'Все цели в сети' },
		target_offline: { label: 'Цель не в сети', hint: 'Все цели не в сети' },
		holder_not_playing: {
			label: 'Нет текущей игры',
			hint: 'У того, кто использует, нет текущей игры',
		},
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
					title: 'Как писать в журнале',
					columns: columns(3),
					fields: [
						{ key: 'unit1', label: 'Для 1', placeholder: 'билет' },
						{ key: 'unit2', label: 'Для 2–4', placeholder: 'билета' },
						{ key: 'unit5', label: 'Для 5 и больше', placeholder: 'билетов' },
					],
				},
				{
					title: 'Правила',
					columns: columns(2),
					fields: [
						...(entry
							? []
							: [
									{
										key: 'scope',
										label: 'Считаются',
										type: 'select' as const,
										options: [
											{ value: 'own', label: 'У каждого игрока свои' },
											{ value: 'shared', label: 'Общие на пати' },
										],
										hint: 'Свои или общие на пати — выбирается один раз, потом не изменить.',
									},
								]),
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
						{
							key: 'startValue',
							label: 'Начальное значение',
							numeric: true,
							placeholder: '0',
						},
						{
							key: 'minimum',
							label: 'Минимум',
							numeric: true,
							placeholder: 'Без лимита',
						},
						{
							key: 'maximum',
							label: 'Максимум',
							numeric: true,
							placeholder: 'Без лимита',
						},
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
							required: 'действие',
							empty:
								'Что произойдёт, когда игрок применит предмет. Например: владелец получает 10 золота.',
							addLabel: 'Действие',
							hint: 'Цель игрок выберет сам, когда применит предмет.',
						},
						{
							key: 'chooseEntries',
							type: 'check',
							label: 'Игрок выбирает, что применить',
							hint: 'При использовании он отметит строки, которые сработают.',
						},
						{
							key: 'usesMax',
							label: 'Количество использований',
							numeric: true,
							width: 120,
							placeholder: '1',
						},
						{
							key: 'conditions',
							label: 'Условия',
							type: 'chips',
							options: (Object.keys(conditionLabels) as ItemCondition[]).map(
								(c) => ({ value: c, ...conditionLabels[c] }),
							),
							addLabel: 'Условие',
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
							when: { key: 'durationPreset', is: 'custom' },
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
			}

			const perkFields = [...common, modifiers]

			// the backend refuses to change the ability: the state of every holder depends on it
			if (entry) {
				const { ability } = entry

				// a perk without an ability has nothing to show on a second tab
				if (!ability) return [{ fields: perkFields }]

				return [
					{ tab: 'perk', fields: perkFields },
					{
						tab: 'ability',
						title: 'Когда игрок применяет',
						fields: [
							{
								key: 'abilityEntriesText',
								type: 'locked',
								label: 'Когда игрок применяет',
								lines: ability.changes ?? [],
							},
						],
					},
					{
						tab: 'ability',
						title: 'Сколько раз',
						fields: [
							{
								key: 'abilityLimitsText',
								type: 'locked',
								label: 'Сколько раз',
								lines: abilityLimitLines(ability),
							},
						],
					},
					{
						tab: 'ability',
						fields: [
							{
								key: 'abilityNote',
								type: 'note',
								label: '',
								hint: 'Способность не меняется после создания: от неё зависит состояние у всех владельцев. Нужна другая — создай новый перк.',
							},
						],
					},
				]
			}

			const limited = { key: 'abilityLimit', is: 'limited' }

			return [
				{
					tab: 'perk',
					fields: [
						...perkFields,
						{
							key: 'abilityOn',
							type: 'check',
							label: 'Игрок применяет перк сам',
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
							required: 'действие способности',
							addLabel: 'Действие',
						},
						{
							key: 'abilityChooseEntries',
							type: 'check',
							label: 'Игрок выбирает, что применить',
							hint: 'При использовании способности он отметит строки, которые сработают.',
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
						{
							key: 'abilityUsesMax',
							label: 'Максимум',
							numeric: true,
							required: 'максимум использований',
							when: limited,
						},
						{
							key: 'abilityUsesStart',
							label: 'У нового владельца',
							numeric: true,
							required: 'использования у нового владельца',
							when: limited,
						},
						{
							key: 'abilityRenewal',
							label: 'Полное восстановление раз в',
							type: 'span',
							when: limited,
						},
					],
				},
				{
					tab: 'ability',
					fields: [
						{
							key: 'abilityCharges',
							label: 'Зарядов на одно использование',
							numeric: true,
							optional: true,
							width: 120,
							placeholder: '0',
							hint: 'Столько событий, заряжающих способность, дают одно использование. 0 — зарядов нет.',
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

	if (entry) {
		return entry.ability
			? [perk, { key: 'ability', label: 'Способность', locked: true }]
			: undefined
	}

	return [
		perk,
		{
			key: 'ability',
			label: 'Способность',
			when: { key: 'abilityOn', is: true },
		},
	]
})

/** what the ability of an existing perk allows, as the lines of the locked tab */
const abilityLimitLines = (ability: PerkAbility) => {
	if (!ability.uses) return ['Сколько угодно.']

	const lines = [
		`До ${ability.uses.max} раз, новый владелец начинает с ${ability.uses.start}.`,
	]

	if (ability.chargesMax > 0) {
		lines.push(`Зарядов на одно использование: ${ability.chargesMax}.`)
	}

	if (ability.renewalPeriod) {
		lines.push(
			`Раз в ${formatSpanExact(ability.renewalPeriod)} возвращается к максимуму.`,
		)
	}

	return lines
}

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
	chooseEntries: entry?.shouldApplyToAll === false,
	conditions: [...(entry?.conditions ?? [])],
	modifiers: modifiersToForm(entry?.modifiers ?? []),
	abilityEntries: itemEntriesToForm(entry?.ability?.entries ?? []),
	abilityChooseEntries: entry?.ability?.shouldApplyToAll === false,
	abilityUsesMax: entry?.ability?.uses ? String(entry.ability.uses.max) : '',
	abilityUsesStart: entry?.ability?.uses
		? String(entry.ability.uses.start)
		: '',
	abilityCharges: entry?.ability ? String(entry.ability.chargesMax) : '',
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
	scope: shared ? 'shared' : 'own',
}))

const title = computed(() => (entry ? `Изменить «${entry.name}»` : adds[kind]))

const submitLabel = computed(() => (entry ? 'Сохранить' : creates[kind]))

const invalid = (title: string, text: string) => {
	toastStore.show(title, text, 'danger')
}

/** the limits of the ability, or the text of what is wrong with them */
const readAbility = (
	text: (key: string) => string,
	entries: ItemEntryRow[],
	shouldApplyToAll: boolean,
): PerkAbility | string => {
	// without a limit there are no charges and no renewal
	if (text('abilityLimit') !== 'limited') {
		return { shouldApplyToAll, entries, chargesMax: 0 }
	}

	const charges = text('abilityCharges')
	const renewal = text('abilityRenewal')
	const chargesMax = charges ? Number(charges) : 0
	const renewalPeriod = renewal ? Number(renewal) : undefined

	if (!Number.isInteger(chargesMax) || chargesMax < 0) {
		return 'Зарядов — целое число, не меньше нуля.'
	}

	if (
		renewalPeriod !== undefined &&
		!(
			Number.isInteger(renewalPeriod) &&
			renewalPeriod >= 1 &&
			renewalPeriod <= 315_360_000
		)
	) {
		return 'Восстановление: целое число, не больше 10 лет. Или убери его крестиком.'
	}

	const max = Number(text('abilityUsesMax'))
	const start = Number(text('abilityUsesStart'))

	if (
		!Number.isInteger(max) ||
		max < 1 ||
		!Number.isInteger(start) ||
		start < 0
	) {
		return 'Использования: максимум — целое число от 1, у нового владельца — целое число от 0.'
	}

	return {
		shouldApplyToAll,
		entries,
		uses: { max, start },
		chargesMax,
		...(renewalPeriod != null && { renewalPeriod }),
	}
}

const onSave = async (values: FormValues) => {
	const text = (key: string) => String(values[key] ?? '').trim()
	const name = text('name')
	const description = text('description')

	if (
		kind === 'point-types' &&
		!(text('unit1') && text('unit2') && text('unit5'))
	) {
		return invalid('Впиши единицы', 'Нужны все три формы: 1, 2–4 и 5 и больше.')
	}

	const input: CatalogEntryInput = { name, description }

	if (kind === 'point-types') {
		const startValue = text('startValue') ? Number(text('startValue')) : 0
		const minimum = text('minimum') ? Number(text('minimum')) : null
		const maximum = text('maximum') ? Number(text('maximum')) : null

		if (
			![startValue, minimum, maximum].every(
				(n) => n === null || Number.isInteger(n),
			)
		) {
			return invalid(
				'Не понял число',
				'Стартовое значение и границы — целые числа.',
			)
		}

		if (minimum !== null && maximum !== null && minimum > maximum) {
			return invalid(
				'Границы перепутаны',
				'Минимум не может быть больше максимума.',
			)
		}

		if (
			(minimum !== null && startValue < minimum) ||
			(maximum !== null && startValue > maximum)
		) {
			return invalid(
				'Старт вне границ',
				'Стартовое значение должно быть между минимумом и максимумом.',
			)
		}

		input.unitForms = {
			one: text('unit1'),
			several: text('unit2'),
			many: text('unit5'),
		}
		input.startValue = startValue
		input.minimum = minimum
		input.maximum = maximum
		input.isPublic = text('visibility') !== 'admins'

		if (!entry) input.isShared = text('scope') === 'shared'
	}

	if (kind === 'items') {
		const entries = parseItemEntries(values.entries as FormRow[])

		if ('error' in entries) return invalid('Проверь изменения', entries.error)

		const usesMax = Number(text('usesMax'))

		if (!(Number.isInteger(usesMax) && usesMax > 0)) {
			return invalid(
				'Не понял число использований',
				'Нужно целое число больше нуля.',
			)
		}

		const conditions = values.conditions as ItemCondition[]

		if (
			conditions.includes('target_online') &&
			conditions.includes('target_offline')
		) {
			return invalid(
				'Условия не сочетаются',
				'Цели не могут быть и в сети, и не в сети.',
			)
		}

		const needsTargets = conditions.some((c) => c.startsWith('target_'))

		if (needsTargets && !entries.value.some((e) => e.who === 'chosen')) {
			return invalid(
				'Нужна выбранная цель',
				'Условия про цели работают, когда есть строка с целью.',
			)
		}

		input.entries = entries.value
		input.shouldApplyToAll = values.chooseEntries !== true
		input.usesMax = usesMax
		input.conditions = conditions
	}

	if (kind === 'effects') {
		const modifiers = parseModifiers(values.modifiers as FormRow[])

		if ('error' in modifiers)
			return invalid('Проверь изменения', modifiers.error)

		input.modifiers = modifiers.value

		const preset = text('durationPreset')

		if (preset === 'none') input.duration = null
		else if (preset === 'custom')
			input.duration = parseSpan(text('duration')) ?? NaN
		else input.duration = Number(preset)

		if (Number.isNaN(input.duration)) {
			return invalid(
				'Не понял длительность',
				'Напиши, например, «2 ч» или «1 день».',
			)
		}
	}

	if (kind === 'perks') {
		const modifiers = parseModifiers(values.modifiers as FormRow[])

		if ('error' in modifiers)
			return invalid('Проверь изменения', modifiers.error)

		input.modifiers = modifiers.value

		// the ability of an existing perk is locked and the backend does not change it;
		// a new perk is active when the player may use it, otherwise passive
		if (!entry && values.abilityOn === true) {
			const entries = parseItemEntries(values.abilityEntries as FormRow[])

			if ('error' in entries)
				return invalid('Проверь способность', entries.error)

			const ability = readAbility(
				text,
				entries.value,
				values.abilityChooseEntries !== true,
			)

			if (typeof ability === 'string')
				return invalid('Проверь способность', ability)

			input.ability = ability
		}
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
		:initial
		:submit-label
		@close="emit('close')"
		@save="onSave"
	/>
</template>

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

const conditionLabels: Record<ItemCondition, string> = {
	target_not_self: 'Цель — не тот, кто использует',
	target_online: 'Все цели в сети',
	target_offline: 'Все цели не в сети',
	holder_not_playing: 'У того, кто использует, нет текущей игры',
}

const conditionFields: FormField[] = (
	Object.keys(conditionLabels) as ItemCondition[]
).map((condition) => ({
	key: `condition_${condition}`,
	type: 'check' as const,
	label: conditionLabels[condition],
	hint: '',
}))

const fields = computed<FormField[]>(() => {
	const common: FormField[] = [
		{
			key: 'name',
			label: 'Название',
			placeholder: {
				'point-types': 'Золото',
				items: 'Свиток удачи',
				effects: 'Щит',
				perks: 'Везунчик',
			}[kind],
		},
		{
			key: 'description',
			label: 'Описание',
			type: 'area',
			placeholder: 'Что это и зачем — так увидят игроки',
			hint: 'Необязательно. Показывается игрокам в подсказках и в ресурсах.',
		},
	]

	switch (kind) {
		case 'point-types':
			return [
				...common,
				{
					key: 'unit1',
					label: 'Единица в журнале · 1',
					placeholder: 'билет',
					hint: 'Как пишется в журнале: 1 билет, 2 билета, 5 билетов.',
				},
				{
					key: 'unit2',
					label: 'Единица в журнале · 2–4',
					placeholder: 'билета',
				},
				{
					key: 'unit5',
					label: 'Единица в журнале · 5 и больше',
					placeholder: 'билетов',
				},
				{
					key: 'startValue',
					label: 'Стартовое значение',
					placeholder: '0',
					hint: 'С чем начинает каждый игрок (или вся пати для общих очков).',
				},
				{
					key: 'minimum',
					label: 'Минимум',
					placeholder: '0',
					hint: 'Пусто — без нижней границы.',
				},
				{
					key: 'maximum',
					label: 'Максимум',
					placeholder: '100',
					hint: 'Пусто — без верхней границы.',
				},
				{
					key: 'isPublic',
					type: 'check',
					label: 'Видят все игроки',
					hint: 'Выключено: тип и его значения видят только админы пати.',
				},
				...(entry
					? []
					: [
							{
								key: 'isShared',
								type: 'check' as const,
								label: 'Общие очки пати',
								hint: 'Одно значение на всю пати, меняется ручной формой. Потом это не изменить.',
							},
						]),
			]
		case 'items':
			return [
				...common,
				{
					key: 'entries',
					label: 'Что делает предмет',
					type: 'rows',
					variant: 'item-entry',
					hint: 'Каждая строка — одно изменение. Минус забирает, «Выбранный предмет» игрок указывает при использовании.',
				},
				{
					key: 'chooseEntries',
					type: 'check',
					label: 'Игрок выбирает, что применить',
					hint: 'При использовании он отметит строки, которые сработают. Остальные пропустятся.',
				},
				{
					key: 'usesMax',
					label: 'Использований',
					placeholder: '1',
					hint: 'Сколько раз можно использовать одну копию предмета.',
				},
				...conditionFields,
			]
		case 'effects':
			return [
				...common,
				{
					key: 'modifiers',
					label: 'Пока эффект действует',
					type: 'rows',
					variant: 'modifier',
					hint: 'Очки, которые меняются сами, пока эффект активен. Пусто — эффект только описание.',
				},
				{
					key: 'duration',
					label: 'Длительность',
					placeholder: '1 день',
					hint: 'Пусто — без срока.',
				},
			]
		default: {
			const modifiers: FormField = {
				key: 'modifiers',
				label: 'Пока перк у игрока',
				type: 'rows',
				variant: 'modifier',
				hint: 'Очки, которые меняются сами, пока перк есть. Пусто — перк только описание.',
			}

			// the backend refuses to change the ability: the state of every holder depends on it
			if (entry) {
				return [
					...common,
					modifiers,
					{
						key: 'abilityNote',
						type: 'note',
						label: 'Способность',
						hint: 'Тип, способность, использования, заряды и обновление после создания не меняются: от них зависит состояние у всех владельцев. Чтобы получить другую способность, создай новый перк.',
					},
				]
			}

			return [
				...common,
				modifiers,
				{
					key: 'perkKind',
					label: 'Тип',
					type: 'select',
					options: [
						{ value: 'active', label: 'активный' },
						{ value: 'passive', label: 'пассивный' },
					],
				},
				{
					key: 'abilityEntries',
					label: 'Что делает способность (активный перк)',
					type: 'rows',
					variant: 'item-entry',
					hint: 'Применяется, когда игрок использует способность, как у предмета.',
				},
				{
					key: 'abilityChooseEntries',
					type: 'check',
					label: 'Игрок выбирает, что применить',
					hint: 'При использовании способности он отметит строки, которые сработают.',
				},
				{
					key: 'abilityUsesMax',
					label: 'Использований: максимум',
					placeholder: '3',
					hint: 'Пусто — без ограничения. Тогда зарядов и обновления нет.',
				},
				{
					key: 'abilityUsesStart',
					label: 'Использований: сколько у нового владельца',
					placeholder: '1',
				},
				{
					key: 'abilityCharges',
					label: 'Зарядов на одно использование',
					placeholder: '0',
					hint: 'Столько событий, заряжающих способность, дают одно использование. 0 — зарядов нет.',
				},
				{
					key: 'abilityRenewal',
					label: 'Обновление использований',
					placeholder: '1 день',
					hint: 'Через это время после последнего изменения использования возвращаются к максимуму. Пусто — не обновляются.',
				},
			]
		}
	}
})

const initial = computed<FormValues>(() => ({
	name: entry?.name ?? '',
	description: entry?.description ?? '',
	unit1: entry?.unitForms?.one ?? '',
	unit2: entry?.unitForms?.several ?? '',
	unit5: entry?.unitForms?.many ?? '',
	entries: itemEntriesToForm(entry?.entries ?? []),
	chooseEntries: entry?.shouldApplyToAll === false,
	modifiers: modifiersToForm(entry?.modifiers ?? []),
	abilityEntries: itemEntriesToForm(entry?.ability?.entries ?? []),
	abilityChooseEntries: entry?.ability?.shouldApplyToAll === false,
	abilityUsesMax: entry?.ability?.uses ? String(entry.ability.uses.max) : '',
	abilityUsesStart: entry?.ability?.uses
		? String(entry.ability.uses.start)
		: '',
	abilityCharges: entry?.ability ? String(entry.ability.chargesMax) : '',
	abilityRenewal: entry?.ability?.renewalPeriod
		? formatSpanExact(entry.ability.renewalPeriod)
		: '',
	...Object.fromEntries(
		(Object.keys(conditionLabels) as ItemCondition[]).map((c) => [
			`condition_${c}`,
			entry?.conditions?.includes(c) ?? false,
		]),
	),
	duration: entry?.duration ? formatSpanExact(entry.duration) : '',
	usesMax: entry?.usesMax != null ? String(entry.usesMax) : '',
	perkKind: entry?.perkKind ?? 'active',
	startValue: entry?.startValue != null ? String(entry.startValue) : '',
	minimum: entry?.minimum != null ? String(entry.minimum) : '',
	maximum: entry?.maximum != null ? String(entry.maximum) : '',
	isPublic: entry?.isPublic ?? true,
	isShared: shared,
}))

const title = computed(() => (entry ? `Изменить «${entry.name}»` : adds[kind]))

const invalid = (title: string, text: string) => {
	toastStore.show(title, text, 'danger')
}

/** the limits of the ability, or the text of what is wrong with them */
const readAbility = (
	text: (key: string) => string,
	entries: ItemEntryRow[],
	shouldApplyToAll: boolean,
): PerkAbility | string => {
	const usesMax = text('abilityUsesMax')
	const usesStart = text('abilityUsesStart')
	const charges = text('abilityCharges')
	const renewal = text('abilityRenewal')
	const chargesMax = charges ? Number(charges) : 0
	const renewalPeriod = renewal ? parseSpan(renewal) : undefined

	if (!Number.isInteger(chargesMax) || chargesMax < 0) {
		return 'Зарядов — целое число, не меньше нуля.'
	}

	if (
		renewal &&
		(renewalPeriod == null || renewalPeriod < 1 || renewalPeriod > 315_360_000)
	) {
		return 'Обновление: напиши, например, «2 ч» или «1 день», не дольше 10 лет.'
	}

	if (!usesMax && !usesStart) {
		return chargesMax > 0 || renewal
			? 'Заряды и обновление нужны, только когда использования ограничены.'
			: { shouldApplyToAll, entries, chargesMax: 0 }
	}

	const max = Number(usesMax)
	const start = Number(usesStart)

	if (
		!usesMax ||
		!usesStart ||
		!Number.isInteger(max) ||
		max < 1 ||
		!Number.isInteger(start) ||
		start < 0
	) {
		return 'Использования: максимум — целое число от 1, у нового владельца — целое число от 0. Или оставь оба пустыми.'
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

	if (!name) return invalid('Впиши название', 'Без него не сохранится.')

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
		input.isPublic = values.isPublic === true

		if (!entry) input.isShared = values.isShared === true
	}

	if (kind === 'items') {
		const entries = parseItemEntries(values.entries as FormRow[])

		if ('error' in entries) return invalid('Проверь изменения', entries.error)
		if (!entries.value.length) {
			return invalid(
				'Добавь изменение',
				'Хотя бы одно: что произойдёт при использовании.',
			)
		}

		const usesMax = Number(text('usesMax'))

		if (!(Number.isInteger(usesMax) && usesMax > 0)) {
			return invalid(
				'Не понял число использований',
				'Нужно целое число больше нуля.',
			)
		}

		const conditions = (Object.keys(conditionLabels) as ItemCondition[]).filter(
			(c) => values[`condition_${c}`] === true,
		)

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
				'Условия про цели работают, когда есть строка «Выбранным игрокам».',
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

		const duration = text('duration')

		input.duration = duration ? (parseSpan(duration) ?? NaN) : null

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

		// the ability of an existing perk is not in the form and the backend does not change it
		if (!entry)
			input.perkKind = text('perkKind') === 'passive' ? 'passive' : 'active'

		if (!entry && input.perkKind === 'active') {
			const entries = parseItemEntries(values.abilityEntries as FormRow[])

			if ('error' in entries)
				return invalid('Проверь способность', entries.error)
			if (!entries.value.length) {
				return invalid(
					'Добавь изменение',
					'Активному перку нужна хотя бы одна строка способности.',
				)
			}

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
		:fields
		:initial
		@close="emit('close')"
		@save="onSave"
	/>
</template>

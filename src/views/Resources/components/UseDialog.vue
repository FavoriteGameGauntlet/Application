<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
	ItemCondition,
	ItemEntryRow,
	ItemUse,
	Login,
} from '../../../api-facade/contracts'
import FormDialog from '../../../components/FormDialog.vue'
import type {
	FormField,
	FormSection,
	FormValues,
} from '../../../components/formDialog'
import { useMembersStore } from '../../../stores/membersStore'
import { useResourcesStore } from '../../../stores/resourcesStore'
import { useSessionStore } from '../../../stores/sessionStore'
import { formatUsesLeft } from '../../../utils/formatResource'
import {
	allowedTargets,
	appliedEntries,
	needsTargets,
	useSlots,
} from '../../../utils/itemUse'

/** what is being used: an item copy or the ability of a perk */
export type UseSubject = {
	title: string
	text: string
	entries: ItemEntryRow[]
	/** false: the user picks which of the entries to apply */
	shouldApplyToAll: boolean
	conditions: ItemCondition[]
	/** the copy that is being used can't pay for its own use */
	excludeCopyId?: number
}

type Props = {
	subject?: UseSubject
}

const { subject } = defineProps<Props>()

const emit = defineEmits<{ close: []; confirm: [use: ItemUse] }>()

const membersStore = useMembersStore()
const resourcesStore = useResourcesStore()
const sessionStore = useSessionStore()

/** what the form holds so far: the sections below are built from it */
const current = ref<FormValues>({})

const listOf = (values: FormValues, key: string) =>
	(values[key] as string[] | undefined) ?? []

const targets = computed(() => listOf(current.value, 'targets'))
/** the `entryId`s picked when the subject doesn't apply all its entries */
const pickedEntryIds = computed(() =>
	listOf(current.value, 'entries').map(Number),
)

const choosesEntries = computed(() => subject?.shouldApplyToAll === false)

/** targets and copies concern the applied entries only */
const entries = computed(() =>
	appliedEntries(
		subject?.entries ?? [],
		!choosesEntries.value,
		pickedEntryIds.value,
	),
)
const withTargets = computed(() => needsTargets(entries.value))

const candidates = computed(() =>
	allowedTargets(membersStore.list, sessionStore.login, subject?.conditions),
)

const nameOf = (login: Login) =>
	membersStore.list.find((m) => m.user.login === login)?.displayName ?? login

const slots = computed(() =>
	useSlots(entries.value, sessionStore.login, targets.value),
)

const copiesOf = (owner: Login | 'party', itemId?: number) =>
	(owner === 'party'
		? membersStore.list.map((m) => m.user.login)
		: [owner]
	).flatMap((login) =>
		(resourcesStore.byUser[login]?.items ?? [])
			.filter(
				(i) =>
					(itemId === undefined || i.itemId === itemId) &&
					i.id !== subject?.excludeCopyId,
			)
			.map((i) => ({
				value: String(i.id),
				label: i.name,
				meta: `${formatUsesLeft(i)}${owner === 'party' ? ` · ${nameOf(login)}` : ''}`,
			})),
	)

/** the owner is in the key, so the copies picked for one player never carry over to another */
const slotKey = (index: number, owner: Login | 'party') =>
	`slot-${index}-${owner}`

/**
 * The backend refuses a copy named twice, so a copy that another slot takes
 * (whole, or by a pick) is not offered to this one: stealing the only item of
 * a player leaves nothing to duplicate.
 */
const rows = computed(() => {
	const takenWhole = new Set<string>()
	/** the slots that name a player go first: the one that copies from the whole party takes what is left */
	const order = slots.value
		.map((slot, index) => ({ slot, index }))
		.sort(
			(a, b) =>
				Number(a.slot.owner === 'party') - Number(b.slot.owner === 'party'),
		)

	const byIndex = order.map(({ slot, index }) => {
		const key = slotKey(index, slot.owner)
		const pickedElsewhere = new Set(
			Object.entries(current.value)
				.filter(([k]) => k.startsWith('slot-') && k !== key)
				.flatMap(([, ids]) => ids as string[]),
		)
		const all = copiesOf(slot.owner, slot.itemId)
		const options = all.filter(
			(o) => !takenWhole.has(o.value) && !pickedElsewhere.has(o.value),
		)
		/** more copies than the entry takes, so the user picks which ones */
		const choose = options.length > slot.count

		if (!choose) options.forEach((o) => takenWhole.add(o.value))

		return {
			index,
			row: {
				key,
				slot,
				options,
				choose,
				/** fewer copies than the entry takes */
				short: options.length < slot.count,
				/** the copies would be enough, but other slots take them */
				taken: all.length >= slot.count && options.length < slot.count,
			},
		}
	})

	return byIndex.sort((a, b) => a.index - b.index).map(({ row }) => row)
})

const heading = (owner: Login | 'party') =>
	owner === 'party'
		? 'Какой предмет скопировать'
		: `Что забрать у ${nameOf(owner)}`

const sections = computed<FormSection[]>(() => {
	const result: FormSection[] = []

	if (choosesEntries.value) {
		result.push({
			title: 'Что применить',
			fields: [
				{
					key: 'entries',
					label: 'Что применить',
					type: 'pick',
					required: 'пункт',
					options: (subject?.entries ?? []).map((e) => ({
						value: String(e.entryId),
						label: e.text ?? '',
					})),
				},
			],
		})
	}

	if (withTargets.value) {
		result.push({
			title: 'На кого',
			fields: [
				{
					key: 'targets',
					label: 'На кого',
					type: 'pick',
					required: 'цель',
					options: candidates.value.map((m) => ({
						value: m.user.login,
						label: m.displayName ?? m.user.login,
						color: membersStore.colorOf(m.user.login),
					})),
					...(!candidates.value.length && {
						hint: 'Сейчас подходящих игроков нет.',
					}),
				},
			],
		})
	}

	for (const row of rows.value.filter((r) => r.choose || r.short)) {
		const field: FormField = {
			key: row.key,
			label: heading(row.slot.owner),
			type: 'pick',
			limit: row.slot.count,
			required: 'предмет',
			options: row.options,
			...(row.short && {
				invalid: true,
				hint: row.taken
					? 'Эти предметы уже заняты другим пунктом.'
					: row.slot.owner === 'party'
						? 'В пати не хватает предметов.'
						: `У ${nameOf(row.slot.owner)} не хватает предметов.`,
			}),
		}

		result.push({ title: field.label, fields: [field] })
	}

	return result
})

const onChange = (values: FormValues) => {
	current.value = values
}

const onSave = (values: FormValues) => {
	const userItemIds = rows.value.flatMap((r) =>
		r.choose
			? listOf(values, r.key).map(Number)
			: r.options.map((o) => Number(o.value)),
	)

	emit('confirm', {
		...(choosesEntries.value && {
			entryIds: listOf(values, 'entries').map(Number),
		}),
		...(withTargets.value && { targetLogins: listOf(values, 'targets') }),
		...(userItemIds.length > 0 && { userItemIds }),
	})
}

/** an inventory that is in the store may be old (it is read again only when someone looks at the player), so each one is read once per opening */
const refreshed = new Set<Login>()

watch(
	() => subject,
	() => {
		current.value = {}
		refreshed.clear()
	},
)

// the inventories the slots take from
watch(
	slots,
	(list) => {
		const logins = new Set(
			list.flatMap((s) =>
				s.owner === 'party'
					? membersStore.list.map((m) => m.user.login)
					: [s.owner],
			),
		)

		logins.forEach((login) => {
			if (refreshed.has(login)) return

			refreshed.add(login)
			resourcesStore.loadUser(login)
		})
	},
	{ immediate: true },
)
</script>

<template>
	<FormDialog
		:open="!!subject"
		:title="subject?.title ?? ''"
		:subtitle="subject?.text"
		:sections
		:initial="{}"
		submit-label="Использовать"
		:width="480"
		@close="emit('close')"
		@save="onSave"
		@change="onChange"
	/>
</template>

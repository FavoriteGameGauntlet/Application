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
const targets = ref<Login[]>([])
/** the `entryId`s picked when the subject doesn't apply all its entries */
const pickedEntryIds = ref<number[]>([])

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

const rows = computed(() =>
	slots.value.map((slot, index) => {
		const options = copiesOf(slot.owner, slot.itemId)

		return {
			index,
			slot,
			options,
			/** more copies than the entry takes, so the user picks which ones */
			choose: options.length > slot.count,
			/** fewer copies than the entry takes */
			short: options.length < slot.count,
		}
	}),
)

const heading = (owner: Login | 'party') =>
	owner === 'party'
		? 'Какой предмет скопировать'
		: `Что забрать у ${nameOf(owner)}`

/** the owner is in the key, so the copies picked for one player never carry over to another */
const slotKey = (row: (typeof rows.value)[number]) =>
	`slot-${row.index}-${row.slot.owner}`

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
			key: slotKey(row),
			label: heading(row.slot.owner),
			type: 'pick',
			limit: row.slot.count,
			required: 'предмет',
			options: row.options,
			...(row.short && {
				invalid: true,
				hint:
					row.slot.owner === 'party'
						? 'В пати не хватает предметов.'
						: `У ${nameOf(row.slot.owner)} не хватает предметов.`,
			}),
		}

		result.push({ title: field.label, fields: [field] })
	}

	return result
})

const listOf = (values: FormValues, key: string) =>
	(values[key] as string[] | undefined) ?? []

const onChange = (values: FormValues) => {
	targets.value = listOf(values, 'targets')
	pickedEntryIds.value = listOf(values, 'entries').map(Number)
}

const onSave = (values: FormValues) => {
	const userItemIds = rows.value.flatMap((r) =>
		r.choose
			? listOf(values, slotKey(r)).map(Number)
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
		targets.value = []
		pickedEntryIds.value = []
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

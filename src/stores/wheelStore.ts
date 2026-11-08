import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type {
	SpinPayment,
	WheelGroup,
	WheelSpinResult,
} from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import {
	buildPayment,
	needsChoice,
	paymentChoices,
	type PaymentChoice,
} from '../utils/spinPayment'
import { RouteName } from '../router/routeNames'
import { router } from '../router/router'
import type { HttpErrorResponse } from '../api-facade/http'
import { useCurrentGameStore } from './currentGameStore'
import { useJournalStore } from './journalStore'
import { useManualStore } from './manualStore'
import { useMembersStore } from './membersStore'
import { useResourcesStore } from './resourcesStore'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'
import { useWishlistStore } from './wishlistStore'

export type WheelTab = 'points' | 'games'

const MIN_STEPS = 18
const REROLL_START_DELAY_MS = 350

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useWheelStore = defineStore(StoreName.Wheel, () => {
	const tab = ref<WheelTab>('points')
	const groups = ref<WheelGroup[]>([])
	/** the selected group of the «points» tab */
	const groupId = ref<number>()
	/** the selected group of the «games» tab */
	const gameGroupId = ref<number>()

	const pos = ref(0)
	const spinning = ref(false)
	const result = ref<WheelSpinResult | null>(null)
	/** reel of the last spin; falls back to the pool of the selected source */
	const spunEntries = ref<string[] | null>(null)
	/** the cost rows with the copies to pick from, set while the choice dialog is open */
	const pendingChoices = ref<PaymentChoice[] | null>(null)

	const changeGroups = computed(() =>
		groups.value.filter((g) => g.kind === 'changes'),
	)

	/** the wishlist goes first, then the groups of games of the party */
	const gameGroups = computed(() =>
		groups.value
			.filter((g) => g.kind !== 'changes')
			.sort(
				(a, b) => Number(b.kind === 'wishlist') - Number(a.kind === 'wishlist'),
			),
	)

	/** the selected source of the current tab */
	const group = computed(() =>
		(tab.value === 'games' ? gameGroups.value : changeGroups.value).find(
			(g) =>
				g.id === (tab.value === 'games' ? gameGroupId.value : groupId.value),
		),
	)

	const pool = computed(
		() =>
			spunEntries.value ??
			(group.value?.kind === 'wishlist'
				? useWishlistStore().mine.map((g) => g.name)
				: (group.value?.entries.map((e) => e.name) ?? [])),
	)

	const resultGroup = computed(() => {
		const source = result.value?.source

		return source && groups.value.find((g) => g.id === source.groupId)
	})

	/** applying the result starts the game instead of granting changes */
	const resultStartsGame = computed(() => resultGroup.value?.kind !== 'changes')

	/** what the result card shows after «Выпало ·» */
	const resultSource = computed(() => {
		if (resultGroup.value?.kind === 'wishlist') return 'Вишлист'

		return resultGroup.value?.name ?? ''
	})

	const load = async () => {
		groups.value = await api.wheel.groups()
		groupId.value ??= changeGroups.value[0]?.id
		gameGroupId.value ??= gameGroups.value[0]?.id

		await useWishlistStore().loadMine()
	}

	/** hides the shown result; the server keeps it until the next spin replaces it */
	const clearResult = () => {
		result.value = null
		spunEntries.value = null
	}

	const setTab = (value: WheelTab) => {
		if (spinning.value) return

		tab.value = value
		pos.value = 0
		clearResult()
	}

	const setGroup = (id: number) => {
		if (spinning.value) return

		if (tab.value === 'games') {
			gameGroupId.value = id
		} else {
			groupId.value = id
		}

		pos.value = 0
		clearResult()
	}

	const animate = (spin: WheelSpinResult) =>
		new Promise<void>((resolve) => {
			const n = spin.entries.length

			spunEntries.value = spin.entries
			pos.value %= n

			let total = (spin.resultIndex - pos.value + n) % n
			while (total < MIN_STEPS) total += n

			let i = 0

			const step = () => {
				i++
				pos.value = (pos.value + 1) % n

				if (i < total) {
					setTimeout(step, 35 + 300 * Math.pow(i / total, 3))
				} else {
					result.value = spin
					spinning.value = false
					resolve()
				}
			}

			step()
		})

	const spin = async () => {
		const source = group.value

		if (spinning.value || !source || !pool.value.length) return

		spinning.value = true
		result.value = null

		try {
			await animate(await api.wheel.spin({ groupId: source.id }))
		} catch (e) {
			spinning.value = false

			if ((e as HttpErrorResponse).body?.code === 'CURRENT_GAME_EXISTS') {
				useToastStore().show(
					'Идёт игра',
					'Колесо игр можно крутить, когда текущая игра закончена.',
					'danger',
				)
			} else {
				useToastStore().error(e)
			}
		}
	}

	/** opens the games tab and spins it, used after the current game is rerolled */
	const spinGames = async () => {
		tab.value = 'games'
		spunEntries.value = null
		result.value = null
		pos.value = 0

		// the groups may not be loaded yet when the wheel was never opened
		await Promise.all([router.push({ name: RouteName.Wheel }), load()])

		gameGroupId.value =
			gameGroups.value.find((g) => g.kind === 'wishlist')?.id ??
			gameGroupId.value

		if (!pool.value.length) {
			useToastStore().show(
				'Вишлист пуст',
				'Перекручивать не из чего.',
				'danger',
			)
			return
		}

		await sleep(REROLL_START_DELAY_MS)
		await spin()
	}

	/** the user picks what to give when the cost can be paid with different copies */
	const apply = async () => {
		const applied = result.value
		const toast = useToastStore()

		if (!applied) return

		const cost =
			groups.value.find((g) => g.id === applied.source.groupId)?.cost ?? []

		if (!cost.length) return applySpin(applied)

		const resourcesStore = useResourcesStore()

		try {
			await resourcesStore.loadMine()
		} catch (e) {
			toast.error(e)
			return
		}

		const mine = resourcesStore.byUser[useSessionStore().login]
		const choices = paymentChoices(cost, mine)

		if (choices.some(needsChoice)) {
			pendingChoices.value = choices
			return
		}

		await applySpin(applied, buildPayment(choices, {}))
	}

	const confirmPayment = async (picked: Record<number, number[]>) => {
		const choices = pendingChoices.value
		const applied = result.value

		pendingChoices.value = null

		if (choices && applied)
			await applySpin(applied, buildPayment(choices, picked))
	}

	const cancelPayment = () => {
		pendingChoices.value = null
	}

	const applySpin = async (applied: WheelSpinResult, payment?: SpinPayment) => {
		const group = resultSource.value
		const toast = useToastStore()

		// the backend takes targets for a group of changes only (and requires them);
		// the design has no picker yet, so the change goes to the one who spun
		const startsGame = resultStartsGame.value
		const targetLogins = startsGame ? undefined : [useSessionStore().login]

		try {
			await api.wheel.apply(payment, targetLogins)

			result.value = null
			spunEntries.value = null

			if (startsGame) {
				if (payment) {
					await useResourcesStore().loadMine()
					useJournalStore().bump()
				}

				toast.show(
					`Новая игра: ${applied.result.name}`,
					'Выпала на колесе. Таймер с нуля.',
				)

				await Promise.all([
					useCurrentGameStore().load(),
					useWishlistStore().loadMine(),
					useMembersStore().load(),
				])
			} else {
				await useResourcesStore().loadMine()
				useJournalStore().bump()

				if (applied.result.isManualChange) {
					await useManualStore().startWheel({
						name: applied.result.name,
						group,
						description:
							applied.result.description ?? `Эффект из группы «${group}».`,
					})
				} else {
					toast.show('Применено', applied.result.name)
				}
			}
		} catch (e) {
			toast.error(e)
		}
	}

	return {
		tab,
		groups,
		changeGroups,
		gameGroups,
		group,
		pos,
		spinning,
		result,
		pool,
		resultSource,
		resultStartsGame,
		pendingChoices,
		load,
		setTab,
		setGroup,
		clearResult,
		spin,
		spinGames,
		apply,
		confirmPayment,
		cancelPayment,
	}
})

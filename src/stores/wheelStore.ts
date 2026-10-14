import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api-facade/api'
import type { WheelGroup, WheelSpinResult } from '../api-facade/contracts'
import { StoreName } from '../enums/storeName'
import { RouteName } from '../router/routeNames'
import { router } from '../router/router'
import type { HttpErrorResponse } from '../api-facade/http'
import { useCurrentGameStore } from './currentGameStore'
import { useJournalStore } from './journalStore'
import { useMembersStore } from './membersStore'
import { useResourcesStore } from './resourcesStore'
import { useToastStore } from './toastStore'
import { useWishlistStore } from './wishlistStore'
import { useTimerStore } from './timerStore'

export type WheelTab = 'points' | 'games'

const MIN_STEPS = 18
const REROLL_START_DELAY_MS = 350

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useWheelStore = defineStore(StoreName.Wheel, () => {
	const tab = ref<WheelTab>('points')
	const groups = ref<WheelGroup[]>([])
	const groupId = ref<number>()

	const pos = ref(0)
	const spinning = ref(false)
	const result = ref<WheelSpinResult | null>(null)
	/** reel of the last spin; falls back to the pool of the selected source */
	const spunEntries = ref<string[] | null>(null)

	/** the «points» tab; the games are spun from the wishlist */
	const changeGroups = computed(() => groups.value.filter((g) => g.kind === 'changes'))

	const group = computed(() => groups.value.find((g) => g.id === groupId.value))

	const pool = computed(
		() =>
			spunEntries.value ??
			(tab.value === 'games'
				? useWishlistStore().mine.map((g) => g.name)
				: (group.value?.entries.map((e) => e.name) ?? [])),
	)

	/** what the result card shows after «Выпало ·» */
	const resultSource = computed(() => {
		const source = result.value?.source

		if (!source) return ''
		if (source === 'wishlist') return 'Вишлист'

		return groups.value.find((g) => g.id === source.groupId)?.name ?? ''
	})

	const load = async () => {
		groups.value = await api.wheel.groups()
		groupId.value ??= changeGroups.value[0]?.id

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

		groupId.value = id
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
		if (spinning.value || !pool.value.length) return

		/** spinning again while a result is shown drops it: a free reroll */
		const isReroll = result.value !== null

		spinning.value = true
		result.value = null

		try {
			await animate(
				await api.wheel.spin(
					tab.value === 'games' ? 'wishlist' : { groupId: groupId.value! },
					isReroll,
				),
			)
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

		await Promise.all([
			router.push({ name: RouteName.Wheel }),
			useWishlistStore().loadMine(),
		])

		if (!pool.value.length) {
			useToastStore().show('Вишлист пуст', 'Перекручивать не из чего.', 'danger')
			return
		}

		await sleep(REROLL_START_DELAY_MS)
		await spin()
	}

	const apply = async () => {
		const applied = result.value
		const toast = useToastStore()

		if (!applied) return

		try {
			await api.wheel.apply(applied.spinId)

			result.value = null
			spunEntries.value = null

			if (applied.source === 'wishlist') {
				toast.show(
					`Новая игра: ${applied.result.name}`,
					'Выпала на колесе. Таймер с нуля.',
				)

				await Promise.all([
					useCurrentGameStore().load(),
					useTimerStore().load(),
					useWishlistStore().loadMine(),
					useMembersStore().load(),
				])
			} else {
				if (applied.result.isManualChange) {
					toast.show(
						'Нужно ручное изменение',
						`${applied.result.name}. Формы пока нет в макетах.`,
						'info',
					)
				} else {
					toast.show('Применено', applied.result.name)
				}

				await useResourcesStore().loadMine()
				useJournalStore().bump()
			}
		} catch (e) {
			toast.error(e)
		}
	}

	return {
		tab,
		groups,
		changeGroups,
		groupId,
		pos,
		spinning,
		result,
		pool,
		resultSource,
		load,
		setTab,
		setGroup,
		clearResult,
		spin,
		spinGames,
		apply,
	}
})

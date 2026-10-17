import { formatJournalSource } from '../../utils/format'
import { countItems } from '../../utils/userItems'
import type {
	Api,
	CompletedGame,
	CurrentGame,
	Exchange,
	JournalEntry,
	Login,
	Member,
	Party,
	ResourceRef,
	Reward,
	RewardRow,
	SpinCostRef,
	SpinPayment,
	Timer,
	UserResources,
	WheelEntry,
	WheelSource,
	WheelSpinResult,
} from '../contracts'
import { adminApi } from './adminApi'
import * as adminDb from './adminDb'
import * as db from './db'
import { fail, newId, now, reply } from './helpers'
import { pushJournal, signedText, text } from './journal'
import { applyManual, itemCopies, perkOf, removeItems } from './manual'

// ---- resources

const have = (login: Login, ref: ResourceRef) => {
	const res = db.resources[login]

	switch (ref.kind) {
		case 'points':
			return res.points[ref.id] ?? 0
		case 'item':
			return countItems(res.items, ref.id)
		default:
			return 0
	}
}

const ownsPerk = (login: Login, id: number) =>
	db.resources[login].perks.some((p) => p.id === id)

const applyRef = (login: Login, ref: ResourceRef, sign: 1 | -1) => {
	const res = db.resources[login]

	switch (ref.kind) {
		case 'points':
			res.points[ref.id] = (res.points[ref.id] ?? 0) + sign * ref.amount
			break
		case 'item': {
			const delta = sign * ref.amount

			if (delta > 0) {
				res.items.push(...itemCopies(ref.id, delta))
			} else {
				removeItems(res, ref.id, -delta)
			}
			break
		}
		case 'perk':
			if (sign > 0) {
				if (!ownsPerk(login, ref.id)) res.perks.push(perkOf(ref.id))
			} else {
				res.perks = res.perks.filter((p) => p.id !== ref.id)
			}
			break
	}
}

// ---- timer and current game

const currentElapsed = () => {
	const { timer } = db.state

	if (timer.state !== 'running') return timer.elapsed

	return Math.min(
		db.TIMER_GOAL,
		timer.elapsed + Math.floor((Date.now() - timer.stampedAt) / 1000),
	)
}

const setTimerState = (state: Timer['state']) => {
	db.state.timer = { state, elapsed: currentElapsed(), stampedAt: Date.now() }
}

const rewardCatalog = {
	points: 'point-types',
	item: 'items',
	effect: 'effects',
} as const

const rewardName = (row: RewardRow) =>
	adminDb.catalog[rewardCatalog[row.kind]].find((e) => e.id === row.targetId)
		?.name ?? ''

const toReward = (rows: RewardRow[]): Reward =>
	rows.map((row) => ({ label: rewardName(row), value: row.amount }))

/** what a reward grants at once; an effect needs a duration of its own, so it is only shown */
const rewardRefs = (rows: RewardRow[]): ResourceRef[] =>
	rows.flatMap<ResourceRef>((row) => {
		const amount = parseInt(row.amount.replace('−', '-'), 10) || 0

		if (row.kind === 'points') {
			return [{ kind: 'points', id: row.targetId, name: rewardName(row), amount }]
		}

		if (row.kind === 'item') {
			return [{ kind: 'item', id: row.targetId, name: rewardName(row), amount }]
		}

		return []
	})

const getTimer = (): Timer => ({
	state: db.state.timer.state,
	remainingTime: db.TIMER_GOAL - db.state.timer.elapsed,
	duration: db.TIMER_GOAL,
	lastActionDate: new Date(db.state.timer.stampedAt).toISOString(),
	reward: toReward(adminDb.rewards.timer),
})

const getCurrentGame = (): CurrentGame => ({
	game: db.state.currentGame.game,
	playedSeconds: db.state.currentGame.playedSeconds,
	completionReward: toReward(adminDb.rewards.game),
})

const requireGame = () => {
	const { game, playedSeconds, startedAt } = db.state.currentGame

	if (!game) fail(409, 'NO_CURRENT_GAME', 'Нет текущей игры')

	return { game, playedSeconds, startedAt }
}

const closeGame = (status: CompletedGame['status']) => {
	const { game, playedSeconds, startedAt } = requireGame()

	db.completed[db.ME].unshift({
		gameId: game.id,
		name: game.name,
		startedAt,
		endedAt: now(),
		playedSeconds,
		status,
		rating: null,
		review: null,
	})

	db.state.currentGame = { game: null, playedSeconds: 0, startedAt: now() }
	db.state.timer = { state: 'created', elapsed: 0, stampedAt: Date.now() }

	const entry = pushJournal(
		{ type: 'game', id: game.id, name: game.name, event: status },
		false,
		[],
	)

	return { game, entry }
}

/** the game is current or in the history of the user with any status */
const isPicked = (login: Login, gameId: number) =>
	(db.completed[login] ?? []).some((g) => g.gameId === gameId) ||
	(login === db.ME && db.state.currentGame.game?.id === gameId)

// ---- wheel

const requireNoGame = () => {
	if (db.state.currentGame.game) {
		fail(409, 'CURRENT_GAME_EXISTS', 'Игру нельзя крутить, пока идёт текущая')
	}
}

const spinCostOf = (groupId: number) => db.spinCosts[groupId] ?? []

/** how many of the cost resource the user holds; a perk or an effect is held once */
const haveCost = (login: Login, cost: SpinCostRef) => {
	const res = db.resources[login]

	switch (cost.kind) {
		case 'points':
			return res.points[cost.id] ?? 0
		case 'item':
			return countItems(res.items, cost.id)
		case 'perk':
			return res.perks.filter((p) => p.id === cost.id).length
		case 'effect':
			return res.effects.filter((e) => e.id === cost.id).length
	}
}

/** a spin costs nothing, but there is no point in spinning what can't be applied */
const requireSpinCost = (groupId: number) => {
	const lacking = spinCostOf(groupId).find((r) => haveCost(db.ME, r) < r.amount)

	if (lacking) fail(409, 'INSUFFICIENT', `Не хватает: ${lacking.name}`)
}

const paymentKey = { item: 'items', perk: 'perks', effect: 'effects' } as const

/** the copies that can pay a cost row, the most used items first */
const heldCopies = (res: UserResources, cost: SpinCostRef): { id: number }[] => {
	switch (cost.kind) {
		case 'item':
			return res.items
				.filter((i) => i.itemId === cost.id)
				.sort((a, b) => a.usesLeft - b.usesLeft)
		case 'perk':
			return res.perks.filter((p) => p.id === cost.id)
		case 'effect':
			return res.effects.filter((e) => e.id === cost.id)
		case 'points':
			return []
	}
}

/** the ids of the copies that go for a cost row; 409 INVALID_PAYMENT when the chosen ones don't fit */
const chooseCopies = (res: UserResources, cost: SpinCostRef, payment?: SpinPayment) => {
	if (cost.kind === 'points') return []

	const held = heldCopies(res, cost)

	if (!payment) return held.slice(0, cost.amount).map((c) => c.id)

	const chosen = payment[paymentKey[cost.kind]].filter((id) => held.some((c) => c.id === id))

	if (chosen.length !== cost.amount || new Set(chosen).size !== chosen.length) {
		fail(409, 'INVALID_PAYMENT', `Выбрано не то, что нужно: ${cost.name}`)
	}

	return chosen
}

const takeCopies = (res: UserResources, cost: SpinCostRef, ids: number[]) => {
	switch (cost.kind) {
		case 'item':
			res.items = res.items.filter((i) => !ids.includes(i.id))
			break
		case 'perk':
			res.perks = res.perks.filter((p) => !ids.includes(p.id))
			break
		case 'effect':
			res.effects = res.effects.filter((e) => !ids.includes(e.id))
			break
	}
}

const costLine = (cost: SpinCostRef): JournalEntry['changes'][number] => {
	switch (cost.kind) {
		case 'perk':
			return {
				login: db.ME,
				text: `−перк ${cost.name}`,
				resource: { kind: 'perk', id: cost.id, name: cost.name },
			}
		case 'effect':
			return {
				login: db.ME,
				text: `снят эффект ${cost.name}`,
				resource: { kind: 'effect', id: cost.id, name: cost.name },
			}
		default: {
			const resource: ResourceRef = { ...cost, kind: cost.kind, amount: -cost.amount }

			return { login: db.ME, text: signedText(resource), resource }
		}
	}
}

/** the result is stored on the server, a new spin replaces the previous one */
const makeSpin = (source: WheelSource, entries: WheelEntry[]) => {
	const resultIndex = Math.floor(Math.random() * entries.length)
	const spin: WheelSpinResult = {
		source,
		entries: entries.map((e) => e.name),
		resultIndex,
		result: entries[resultIndex],
		spinId: newId(),
	}

	db.state.spin = spin
	return spin
}

const spinWishlist = () => {
	requireNoGame()

	const wishlist = db.wishlists[db.ME]

	if (!wishlist.length) fail(409, 'WISHLIST_EMPTY', 'Вишлист пуст')

	return makeSpin(
		'wishlist',
		wishlist.map((w) => ({ id: w.id, name: w.name })),
	)
}

// ---- members

const getMember = (login: Login): Member => {
	const user = db.users.find((p) => p.login === login)

	if (!user) fail(404, 'USER_NOT_FOUND', 'Игрок не найден')

	if (login !== db.ME) {
		const seed = db.memberSeeds[login]

		return {
			user,
			status: seed.status,
			currentGame: seed.currentGame,
			playedSeconds: seed.playedHours * 3600,
			completedCount: seed.completedCount,
			spinsCount: seed.spinsCount,
		}
	}

	const { game } = db.state.currentGame

	return {
		user,
		status: game && db.state.timer.state === 'running' ? 'playing' : 'paused',
		currentGame: game?.name ?? null,
		playedSeconds: db.MY_PLAYED_HOURS * 3600,
		completedCount:
			db.MY_COMPLETED_BEFORE_SEASON +
			db.completed[db.ME].filter((g) => g.status === 'completed').length,
		spinsCount: db.MY_SPINS,
	}
}

// ---- exchanges

const toExchange = (def: db.ExchangeDef): Exchange => {
	const owned = def.get.some((r) => r.kind === 'perk' && ownsPerk(db.ME, r.id))
	const lacks = def.give.some(
		(r) => (r.kind === 'points' || r.kind === 'item') && have(db.ME, r) < r.amount,
	)

	return {
		...structuredClone(def),
		available: !owned && !lacks,
		unavailableReason: owned ? 'perk_owned' : lacks ? 'insufficient' : undefined,
	}
}

const currentParty = () => {
	const party = adminDb.parties.find((p) => p.id === db.state.partyId)

	if (!party) fail(404, 'NOT_FOUND', 'Пати не найдена')

	return party
}

/** the types with `isPublic = false` exist only for the admins of the party */
const visibleTypes = () =>
	db.pointTypes.filter(
		(t) =>
			!adminDb.catalog['point-types'].find((e) => e.id === t.id)?.deleted &&
			(t.isPublic || currentParty().role === 'admin'),
	)

const withVisiblePoints = (res: UserResources): UserResources => {
	const ids = new Set(visibleTypes().map((t) => t.id))

	return {
		...res,
		points: Object.fromEntries(
			Object.entries(res.points).filter(([id]) => ids.has(Number(id))),
		),
	}
}

/** the journal without the changes of the hidden types, an entry that lost all of them is gone */
const withVisibleChanges = (entries: JournalEntry[]): JournalEntry[] => {
	const ids = new Set(visibleTypes().map((t) => t.id))

	return entries.flatMap((entry) => {
		const changes = entry.changes.filter(
			(c) => c.resource?.kind !== 'points' || ids.has(c.resource.id),
		)

		return entry.changes.length && !changes.length ? [] : [{ ...entry, changes }]
	})
}

/** only exchanges that the admin hasn't deleted and that have something to exchange */
const visibleExchanges = () =>
	db.exchangeDefs.filter(
		(d) => !adminDb.deletedExchangeIds.has(d.id) && (d.give.length || d.get.length),
	)

const toParty = (party: adminDb.PartyDef): Party => ({
	...party,
	membersCount: party.id === 1 ? adminDb.members.length : party.membersCount,
	current: party.id === db.state.partyId,
})

const isChangeOf = (entry: JournalEntry, login: Login) =>
	entry.actor === login || entry.changes.some((c) => c.login === login)

export const mockApi: Api = {
	auth: {
		signUp: () => reply(() => undefined),
		logIn: () => reply(() => undefined),
		logOut: () => reply(() => undefined),
	},

	session: {
		getMe: () =>
			reply(() => ({ ...db.users[0], isAdmin: currentParty().role === 'admin' })),
		getSeason: () =>
			reply(() => {
				const { id, name } = currentParty()

				return { id, name }
			}),
	},

	currentGame: {
		get: () => reply(getCurrentGame),
		complete: () =>
			reply(() => {
				const { entry: journalEntry } = closeGame('completed')
				const granted = rewardRefs(adminDb.rewards.game)

				granted.forEach((r) => applyRef(db.ME, r, 1))

				journalEntry.changes = granted.map((resource) => ({
					login: db.ME,
					text: `+${text(resource)}`,
					resource,
				}))

				return { granted, journalEntry }
			}),
		cancel: () =>
			reply(() => {
				closeGame('cancelled')
			}),
		reroll: () =>
			reply(() => {
				closeGame('rerolled')
			}),
	},

	timer: {
		get: () => reply(getTimer),
		start: () =>
			reply(() => {
				requireGame()
				setTimerState('running')

				return getTimer()
			}),
		pause: () =>
			reply(() => {
				requireGame()
				setTimerState('paused')

				return getTimer()
			}),
	},

	wishlist: {
		list: (login) => reply(() => db.wishlists[login] ?? []),
		add: (login, name) =>
			reply(() => {
				const list = (db.wishlists[login] ??= [])

				if (list.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
					fail(409, 'DUPLICATE', 'Игра уже в вишлисте')
				}

				if (isPicked(login, db.gameId(name))) {
					fail(409, 'ALREADY_PICKED', 'Эту игру уже выбирали')
				}

				const game = {
					id: newId(),
					name,
					addedAt: now(),
					addedBy: login === db.ME ? undefined : db.ME,
				}

				list.push(game)
				return game
			}),
		rename: (id, name) =>
			reply(() => {
				const game = db.wishlists[db.ME].find((w) => w.id === id)

				if (!game) fail(404, 'NOT_FOUND', 'Игра не найдена')

				game.name = name
				return game
			}),
		remove: (id) =>
			reply(() => {
				db.wishlists[db.ME] = db.wishlists[db.ME].filter((w) => w.id !== id)
			}),
	},

	completed: {
		list: (login) => reply(() => db.completed[login] ?? []),
		saveReview: (gameId, review) =>
			reply(() => {
				const game = db.completed[db.ME].find((g) => g.gameId === gameId)

				if (!game) fail(404, 'NOT_FOUND', 'Игра не найдена в истории')

				game.rating = review.rating
				game.review = review.review
				return game
			}),
	},

	wheel: {
		groups: () =>
			reply(() => db.wheelGroups.map((g) => ({ ...g, cost: spinCostOf(g.id) }))),
		spin: (source) =>
			reply(() => {
				if (source === 'wishlist') return spinWishlist()

				const group = db.wheelGroups.find((g) => g.id === source.groupId)

				if (!group) fail(404, 'NOT_FOUND', 'Группа не найдена')
				if (group.kind === 'games') {
					requireNoGame()
				} else {
					requireSpinCost(group.id)
				}

				return makeSpin(source, group.entries)
			}),
		apply: (spinId, payment) =>
			reply(() => {
				const spin = db.state.spin

				if (!spin || spin.spinId !== spinId) {
					fail(404, 'NOT_FOUND', 'Прокрут не найден')
				}

				if (spin.source !== 'wishlist') {
					const entries = spin.result.entries ?? []
					const cost = spinCostOf(spin.source.groupId)
					const res = db.resources[db.ME]

					// the spin costs nothing, the cost is charged here together with the result
					requireSpinCost(spin.source.groupId)

					// everything is checked before the first copy is taken
					const taken = cost.map((c) => chooseCopies(res, c, payment))

					cost.forEach((c, i) => {
						if (c.kind === 'points') {
							res.points[c.id] = (res.points[c.id] ?? 0) - c.amount
						} else {
							takeCopies(res, c, taken[i])
						}
					})
					entries.forEach((r) => applyRef(db.ME, r, 1))
					db.state.spin = null
					db.state.appliedSpins[spin.spinId] = spin

					const refLines = [
						...cost.map(costLine),
						...entries.map((resource) => ({
							login: db.ME,
							text: signedText(resource),
							resource,
						})),
					]

					return {
						journalEntry: pushJournal(
							{ type: 'wheel_row', id: spin.result.id, name: spin.result.name },
							!!spin.result.isManualChange,
							entries.length || spin.result.isManualChange
								? refLines
								: [...refLines, { login: db.ME, text: spin.result.name }],
						),
					}
				}

				requireNoGame()

				const wishlist = db.wishlists[db.ME]
				const game = wishlist.find((w) => w.id === spin.result.id)

				if (!game) fail(404, 'NOT_FOUND', 'Игра не найдена')

				const gameId = db.gameId(game.name)

				if (isPicked(db.ME, gameId)) {
					fail(409, 'ALREADY_PICKED', 'Эту игру уже выбирали')
				}

				db.state.spin = null
				db.wishlists[db.ME] = wishlist.filter((w) => w.id !== game.id)
				db.state.currentGame = {
					game: { id: gameId, name: game.name },
					playedSeconds: 0,
					startedAt: now(),
				}
				pushJournal(
					{ type: 'game', id: gameId, name: game.name, event: 'started' },
					false,
					[],
				)
				db.state.timer = { state: 'created', elapsed: 0, stampedAt: Date.now() }

				return { currentGame: getCurrentGame() }
			}),
	},

	resources: {
		pointTypes: () => reply(visibleTypes),
		sharedPoints: () =>
			reply(() =>
				Object.fromEntries(
					visibleTypes()
						.filter((t) => t.isShared)
						.map((t) => [t.id, db.sharedPoints[t.id] ?? 0]),
				),
			),
		leaderboard: (typeId) =>
			reply(() => {
				if (!visibleTypes().some((t) => t.id === typeId && !t.isShared)) {
					fail(404, 'NOT_FOUND', 'Тип очков не найден')
				}

				return {
					typeId,
					rows: db.users
						.map((user) => ({
							user,
							value: db.resources[user.login].points[typeId] ?? 0,
						}))
						.sort((a, b) => b.value - a.value),
				}
			}),
		user: (login) => reply(() => withVisiblePoints(db.resources[login])),
		summary: (kind) =>
			reply(() =>
				db.users.map(({ login }) => {
					const res = db.resources[login]

					return {
						login,
						count:
							kind === 'items'
								? res.items.length
								: res[kind].length,
					}
				}),
			),
		catalog: (kind) =>
			reply(() =>
				adminDb.catalog[kind]
					.filter((e) => !e.deleted)
					.map(({ id, name }) => ({ id, name })),
			),
		catalogEntries: (kind) => reply(() => adminDb.catalog[kind].filter((e) => !e.deleted)),
		useItem: (userItemId) =>
			reply(() => {
				const res = db.resources[db.ME]
				const item = res.items.find((i) => i.id === userItemId)

				if (!item || item.usesLeft === 0) {
					fail(409, 'NO_USES_LEFT', 'Предмет нельзя использовать')
				}

				item.usesLeft -= 1

				// a copy with no uses left is gone
				if (item.usesLeft === 0) res.items = res.items.filter((i) => i !== item)

				return {
					journalEntry: pushJournal(
						{ type: 'item', id: item.itemId, name: item.name },
						true,
						[{ login: db.ME, text: `−1 ${item.name}` }],
					),
				}
			}),
		usePerk: (perkId) =>
			reply(() => {
				const perk = db.resources[db.ME].perks.find((p) => p.id === perkId)

				if (!perk || perk.kind !== 'active' || !perk.usesLeft) {
					fail(409, 'NO_USES_LEFT', 'Перк нельзя использовать')
				}

				perk.usesLeft -= 1

				return {
					journalEntry: pushJournal(
						{ type: 'perk', id: perk.id, name: perk.name },
						true,
						[{ login: db.ME, text: perk.effect.text.replace(/\.$/, '') }],
					),
				}
			}),
		history: (login, kind, id, limit = 4) =>
			reply(() => {
				const resourceKind = { items: 'item', perks: 'perk', effects: 'effect' }[kind]

				return [
					...db.journal.flatMap((j) =>
						j.changes
							.filter(
								(c) =>
									c.login === login &&
									c.resource?.kind === resourceKind &&
									c.resource.id === id,
							)
							.map((c) => ({
								at: j.at,
								source: formatJournalSource(j.source, j.correctsEntryId),
								delta: c.text.match(/^[+−-]\d+/)?.[0] ?? c.text,
							})),
					),
					...(db.resourceHistory[`${login}|${resourceKind}|${id}`] ?? []),
				].slice(0, limit)
			}),
	},

	journal: {
		list: (query) =>
			reply(() => {
				const wanted = query.resource

				const items = withVisibleChanges(db.journal)
					.filter((j) => !query.from || Date.parse(j.at) >= Date.parse(query.from))
					.filter((j) => !query.to || Date.parse(j.at) <= Date.parse(query.to))
					.filter((j) => !query.user || isChangeOf(j, query.user))
					.filter((j) => !query.source || j.source.type === query.source)
					.filter(
						(j) =>
							!wanted ||
							j.changes.some(
								(c) =>
									c.resource?.kind === wanted.kind &&
									(wanted.id === undefined || c.resource.id === wanted.id),
							),
					)

				return { items: query.limit ? items.slice(0, query.limit) : items }
			}),
	},

	members: {
		list: () => reply(() => db.users.map((p) => getMember(p.login))),
		get: (login) => reply(() => getMember(login)),
	},

	exchanges: {
		list: () => reply(() => visibleExchanges().map(toExchange)),
		execute: (id) =>
			reply(() => {
				const def = visibleExchanges().find((d) => d.id === id)

				if (!def) fail(404, 'NOT_FOUND', 'Обмен не найден')
				if (!toExchange(def).available) {
					fail(409, 'UNAVAILABLE', 'Обмен сейчас недоступен')
				}

				def.give.forEach((r) => applyRef(db.ME, r, -1))
				def.get.forEach((r) => applyRef(db.ME, r, 1))

				const journalEntry = pushJournal(
					{ type: 'exchange', id: def.id, name: def.name },
					false,
					[
						...def.give.map((resource) => ({
							login: db.ME,
							text: `−${text(resource)}`,
							resource,
						})),
						...def.get.map((resource) => ({
							login: db.ME,
							text: `+${text(resource)}`,
							resource,
						})),
					],
				)

				return { resources: withVisiblePoints(db.resources[db.ME]), journalEntry }
			}),
	},

	manual: {
		apply: (request) => reply(() => ({ journalEntry: applyManual(request) })),
	},

	parties: {
		list: () => reply(() => adminDb.parties.map(toParty)),
		select: (id) =>
			reply(() => {
				if (!adminDb.parties.some((p) => p.id === id)) {
					fail(404, 'NOT_FOUND', 'Пати не найдена')
				}

				db.state.partyId = id
			}),
	},

	admin: adminApi,
}

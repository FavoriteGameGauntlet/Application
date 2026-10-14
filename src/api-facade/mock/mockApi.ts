import { formatResource } from '../../utils/formatResource'
import type {
	Api,
	CompletedGame,
	CurrentGame,
	Exchange,
	JournalEntry,
	Login,
	Member,
	ResourceRef,
	Timer,
	WheelEntry,
	WheelSource,
	WheelSpinResult,
} from '../contracts'
import type { HttpErrorResponse } from '../http'
import * as db from './db'

const delay = () =>
	new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 150))

function fail(status: number, code: string, message: string): never {
	throw {
		status,
		statusText: code,
		body: { code, message },
		url: '',
		method: '',
	} satisfies HttpErrorResponse
}

/** simulates network latency and isolates the "server" state from the client */
const reply = async <T>(fn: () => T): Promise<T> => {
	await delay()
	return structuredClone(fn())
}

const now = () => new Date().toISOString()

const text = (ref: ResourceRef) => formatResource(ref, db.pointTypes)

// ---- resources

const have = (login: Login, ref: ResourceRef) => {
	const res = db.resources[login]

	switch (ref.kind) {
		case 'points':
			return res.points[ref.type] ?? 0
		case 'item':
			return res.items.find((i) => i.name === ref.name)?.held ?? 0
		default:
			return 0
	}
}

const ownsPerk = (login: Login, name: string) =>
	db.resources[login].perks.some((p) => p.name === name)

const applyRef = (login: Login, ref: ResourceRef, sign: 1 | -1) => {
	const res = db.resources[login]

	switch (ref.kind) {
		case 'points':
			res.points[ref.type] = (res.points[ref.type] ?? 0) + sign * ref.amount
			break
		case 'item': {
			const item = res.items.find((i) => i.name === ref.name)

			if (item) {
				item.held += sign * ref.amount
			} else if (sign > 0) {
				res.items.push(db.makeItem(ref.name, ref.amount))
			}
			break
		}
		case 'perk':
			if (sign > 0) {
				res.perks.push(db.makePerk(ref.name))
			} else {
				res.perks = res.perks.filter((p) => p.name !== ref.name)
			}
			break
	}
}

const pushJournal = (
	source: JournalEntry['source'],
	manual: boolean,
	changes: JournalEntry['changes'],
): JournalEntry => {
	const entry = {
		id: crypto.randomUUID(),
		at: now(),
		actor: db.ME,
		source,
		manual,
		changes,
	}

	db.journal.unshift(entry)
	return entry
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

const timerReward = [
	{ label: 'Золото', value: '+50' },
	{ label: 'Репутация', value: '+2' },
	{ label: 'Билет на колесо', value: '+1' },
]

const getTimer = (): Timer => ({
	state: db.state.timer.state,
	elapsed: currentElapsed(),
	goal: db.TIMER_GOAL,
	serverTime: now(),
	reward: timerReward,
})

const getCurrentGame = (): CurrentGame => ({
	game: db.state.currentGame.game,
	playedSeconds: db.state.currentGame.playedSeconds,
	completionReward: [
		{ label: 'Золото', value: '+200' },
		{ label: 'Репутация', value: '+10' },
		{ label: 'Билет на колесо', value: '+1' },
	],
})

const requireGame = () => {
	const { game, playedSeconds, startedAt } = db.state.currentGame

	if (!game) fail(409, 'NO_CURRENT_GAME', 'Нет текущей игры')

	return { game, playedSeconds, startedAt }
}

const closeGame = (status: CompletedGame['status']) => {
	const { game, playedSeconds, startedAt } = requireGame()

	db.completed[db.ME].unshift({
		id: crypto.randomUUID(),
		name: game.name,
		startedAt,
		endedAt: now(),
		playedSeconds,
		status,
		rating: null,
		review: null,
	})

	db.state.currentGame = { game: null, playedSeconds: 0, startedAt: now() }
	db.state.timer = { state: 'idle', elapsed: 0, stampedAt: Date.now() }

	return game
}

// ---- wheel

const makeSpin = (source: WheelSource, entries: WheelEntry[]) => {
	const resultIndex = Math.floor(Math.random() * entries.length)
	const spin: WheelSpinResult = {
		source,
		entries: entries.map((e) => e.name),
		resultIndex,
		result: entries[resultIndex],
		requiresAdmin: source !== 'wishlist',
		spinId: crypto.randomUUID(),
	}

	db.state.spins.set(spin.spinId, spin)
	return spin
}

const spinWishlist = () => {
	const wishlist = db.wishlists[db.ME]

	if (!wishlist.length) fail(409, 'WISHLIST_EMPTY', 'Вишлист пуст')

	return makeSpin(
		'wishlist',
		wishlist.map((w) => ({ id: w.id, name: w.name })),
	)
}

// ---- members

const getMember = (login: Login): Member => {
	const player = db.players.find((p) => p.login === login)

	if (!player) fail(404, 'PLAYER_NOT_FOUND', 'Игрок не найден')

	if (login !== db.ME) {
		const seed = db.memberSeeds[login]

		return {
			player,
			status: seed.status,
			currentGame: seed.currentGame,
			timer: seed.timer,
			playedSeconds: seed.playedHours * 3600,
			completedCount: seed.completedCount,
			spinsCount: seed.spinsCount,
		}
	}

	const { game } = db.state.currentGame
	const timerState = game ? db.state.timer.state : 'idle'

	return {
		player,
		status: !game ? 'rolling' : timerState === 'running' ? 'playing' : 'paused',
		currentGame: game?.name ?? null,
		timer: { state: timerState, elapsed: currentElapsed() },
		playedSeconds: db.MY_PLAYED_HOURS * 3600,
		completedCount:
			db.MY_COMPLETED_BEFORE_SEASON +
			db.completed[db.ME].filter((g) => g.status === 'completed').length,
		spinsCount: db.MY_SPINS,
	}
}

// ---- exchanges

const toExchange = (def: db.ExchangeDef): Exchange => {
	const owned = def.get.some(
		(r) => r.kind === 'perk' && ownsPerk(db.ME, r.name),
	)
	const lacks = def.give.some(
		(r) => (r.kind === 'points' || r.kind === 'item') && have(db.ME, r) < r.amount,
	)

	return {
		...structuredClone(def),
		available: !owned && !lacks,
		unavailableReason: owned ? 'perk_owned' : lacks ? 'insufficient' : undefined,
	}
}

const isChangeOf = (entry: JournalEntry, login: Login) =>
	entry.actor === login ||
	entry.changes.some((c) => c.player === login || c.player === 'all')

export const mockApi: Api = {
	auth: {
		signUp: () => reply(() => undefined),
		logIn: () => reply(() => undefined),
		logOut: () => reply(() => undefined),
	},

	session: {
		getMe: () => reply(() => ({ ...db.players[0], isAdmin: true })),
		getSeason: () =>
			reply(() => ({
				id: 'autumn',
				name: 'Осенний сезон',
				startsAt: '2026-09-01T00:00:00Z',
				endsAt: '2026-11-30T00:00:00Z',
			})),
	},

	currentGame: {
		get: () => reply(getCurrentGame),
		complete: () =>
			reply(() => {
				const game = closeGame('completed')
				const granted: ResourceRef[] = [
					{ kind: 'points', type: 'Золото', amount: 200 },
					{ kind: 'points', type: 'Репутация', amount: 10 },
					{ kind: 'points', type: 'Билеты', amount: 1 },
				]

				granted.forEach((r) => applyRef(db.ME, r, 1))

				const journalEntry = pushJournal(
					{ kind: 'completion', label: `прохождение · ${game.name}` },
					false,
					granted.map((resource) => ({
						player: db.ME,
						text: `+${text(resource)}`,
						resource,
					})),
				)

				return { granted, journalEntry }
			}),
		cancel: () =>
			reply(() => {
				closeGame('cancelled')
			}),
		reroll: () =>
			reply(() => {
				requireGame()

				const spin = spinWishlist()
				closeGame('rerolled')

				return spin
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

				const game = {
					id: crypto.randomUUID(),
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
		saveReview: (id, review) =>
			reply(() => {
				const game = db.completed[db.ME].find((g) => g.id === id)

				if (!game) fail(404, 'NOT_FOUND', 'Игра не найдена')
				if (game.status !== 'completed') {
					fail(409, 'NOT_COMPLETED', 'Оценить можно только пройденную игру')
				}

				game.rating = review.rating
				game.review = review.review
				return game
			}),
	},

	wheel: {
		groups: () => reply(() => db.wheelGroups),
		spin: (source) =>
			reply(() => {
				if (source === 'wishlist') return spinWishlist()

				const group = db.wheelGroups.find((g) => g.id === source.groupId)

				if (!group) fail(404, 'NOT_FOUND', 'Группа не найдена')

				return makeSpin(source, group.entries)
			}),
		apply: (spinId) =>
			reply(() => {
				const spin = db.state.spins.get(spinId)

				if (!spin) fail(404, 'NOT_FOUND', 'Прокрут не найден')

				db.state.spins.delete(spinId)

				if (spin.source !== 'wishlist') {
					return {
						journalEntry: pushJournal(
							{ kind: 'wheel', label: `колесо · «${spin.result.name}»` },
							true,
							[{ player: db.ME, text: spin.result.name }],
						),
					}
				}

				const wishlist = db.wishlists[db.ME]
				const game = wishlist.find((w) => w.id === spin.result.id)

				if (!game) fail(404, 'NOT_FOUND', 'Игра не найдена')

				db.wishlists[db.ME] = wishlist.filter((w) => w.id !== game.id)
				db.state.currentGame = {
					game: { id: game.id, name: game.name },
					playedSeconds: 0,
					startedAt: now(),
				}
				db.state.timer = { state: 'paused', elapsed: 0, stampedAt: Date.now() }

				return { currentGame: getCurrentGame() }
			}),
		discard: (spinId) =>
			reply(() => {
				db.state.spins.delete(spinId)
			}),
	},

	resources: {
		pointTypes: () => reply(() => db.pointTypes),
		leaderboard: (type) =>
			reply(() => ({
				type,
				rows: db.players
					.map((player) => ({
						player,
						value: db.resources[player.login].points[type] ?? 0,
					}))
					.sort((a, b) => b.value - a.value),
			})),
		player: (login) => reply(() => db.resources[login]),
		summary: (kind) =>
			reply(() =>
				db.players.map(({ login }) => {
					const res = db.resources[login]

					return {
						login,
						count:
							kind === 'items'
								? res.items.reduce((sum, i) => sum + i.held, 0)
								: res[kind].length,
					}
				}),
			),
		useItem: (name, target) =>
			reply(() => {
				const item = db.resources[db.ME].items.find((i) => i.name === name)

				if (!item || item.held === 0 || item.usesLeft === 0) {
					fail(409, 'NO_USES_LEFT', 'Предмет нельзя использовать')
				}

				item.held -= 1
				item.usesLeft -= 1

				const changes: JournalEntry['changes'] = [
					{ player: db.ME, text: `−1 ${name}` },
				]

				if (target && target !== db.ME) {
					changes.push({ player: target, text: item.description })
				}

				return {
					journalEntry: pushJournal(
						{ kind: 'item', label: `предмет «${name}»` },
						true,
						changes,
					),
				}
			}),
		usePerk: (name) =>
			reply(() => {
				const perk = db.resources[db.ME].perks.find((p) => p.name === name)

				if (!perk || perk.kind !== 'active' || !perk.usesLeft) {
					fail(409, 'NO_USES_LEFT', 'Перк нельзя использовать')
				}

				perk.usesLeft -= 1

				return {
					journalEntry: pushJournal(
						{ kind: 'perk', label: `перк «${name}» · ${perk.effect.name}` },
						true,
						[{ player: db.ME, text: perk.effect.text.replace(/\.$/, '') }],
					),
				}
			}),
		history: (login, _kind, name, limit = 4) =>
			reply(() =>
				[
					...db.journal.flatMap((j) =>
						j.changes
							.filter((c) => c.player === login && c.text.includes(name))
							.map((c) => ({
								at: j.at,
								source: j.source.label,
								delta: c.text.match(/^[+−-]\d+/)?.[0] ?? c.text,
							})),
					),
					...(db.resourceHistory[`${login}|${name}`] ?? []),
				].slice(0, limit),
			),
	},

	journal: {
		list: (query) =>
			reply(() => {
				const since = new Date()

				if (query.period === 'today') {
					since.setHours(0, 0, 0, 0)
				} else {
					since.setDate(since.getDate() - 7)
				}

				const [resourceKind, resourceType] = query.resource?.split(':') ?? []

				const items = db.journal
					.filter((j) => Date.parse(j.at) >= since.getTime())
					.filter((j) => !query.player || isChangeOf(j, query.player))
					.filter((j) => !query.source || j.source.kind === query.source)
					.filter(
						(j) =>
							!query.resource ||
							j.changes.some((c) => {
								const r = c.resource

								return (
									!!r &&
									r.kind === resourceKind &&
									(r.kind !== 'points' || r.type === resourceType)
								)
							}),
					)

				return { items: query.limit ? items.slice(0, query.limit) : items }
			}),
	},

	members: {
		list: () => reply(() => db.players.map((p) => getMember(p.login))),
		get: (login) => reply(() => getMember(login)),
	},

	exchanges: {
		list: () => reply(() => db.exchangeDefs.map(toExchange)),
		execute: (id) =>
			reply(() => {
				const def = db.exchangeDefs.find((d) => d.id === id)

				if (!def) fail(404, 'NOT_FOUND', 'Обмен не найден')
				if (!toExchange(def).available) {
					fail(409, 'UNAVAILABLE', 'Обмен сейчас недоступен')
				}

				def.give.forEach((r) => applyRef(db.ME, r, -1))
				def.get.forEach((r) => applyRef(db.ME, r, 1))

				const journalEntry = pushJournal(
					{ kind: 'exchange', label: `обмен «${def.name}»` },
					false,
					[
						...def.give.map((resource) => ({
							player: db.ME,
							text: `−${text(resource)}`,
							resource,
						})),
						...def.get.map((resource) => ({
							player: db.ME,
							text: `+${text(resource)}`,
							resource,
						})),
					],
				)

				return { resources: db.resources[db.ME], journalEntry }
			}),
	},
}

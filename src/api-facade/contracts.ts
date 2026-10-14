// Types of the new backend API. Dates are ISO 8601, durations are seconds,
// all display formatting ("2 ч", "сегодня 14:20") is done by the client.

export type Login = string
export type ISODate = string
export type Seconds = number

export type PlayerRef = {
	login: Login
	/** 1..8 → --player-N */
	colorIndex: number
}

/**
 * UI: играет / на паузе / не в сети. Offline means the app is not running,
 * closing the app pauses the timer.
 */
export type PlayerStatus = 'playing' | 'paused' | 'offline'

export type TimerState = 'running' | 'paused' | 'idle'

/** every entity is identified by an integer id, the name is only for display */
export type ResourceRef =
	| { kind: 'points'; id: number; name: string; amount: number }
	| { kind: 'item'; id: number; name: string; amount: number }
	| { kind: 'perk'; id: number; name: string }
	| { kind: 'effect'; id: number; name: string; duration?: Seconds }

export type ApiError = { code: string; message: string }

// 1. Auth and session

export type Credentials = { login: Login; password: string }

export type Me = PlayerRef & { isAdmin: boolean }

/** a season is a party on the backend */
export type Season = {
	id: number
	name: string
}

// 2. Current game and timer

export type Reward = { label: string; value: string }[]

export type CurrentGame = {
	game: { id: number; name: string } | null
	playedSeconds: Seconds
	completionReward: Reward
}

export type Timer = {
	state: TimerState
	/** at serverTime */
	elapsed: Seconds
	goal: Seconds
	serverTime: ISODate
	reward: Reward
}

// 3. Wishlist and completed games

export type WishlistGame = {
	id: number
	name: string
	addedAt: ISODate
	addedBy?: Login
}

export type CompletedGameStatus = 'completed' | 'cancelled' | 'rerolled'

export type CompletedGame = {
	id: number
	name: string
	startedAt: ISODate
	endedAt: ISODate
	playedSeconds: Seconds
	status: CompletedGameStatus
	/** 1..10 */
	rating: number | null
	review: string | null
}

export type Review = { rating: number; review: string }

// 4. Wheel

export type WheelEntry = {
	id: number
	name: string
	description?: string
	/** the manual change form has to be opened after the entry is applied */
	isManualChange?: boolean
	/** changes that are applied automatically, there may be some next to isManualChange */
	entries?: ResourceRef[]
}

/**
 * Groups are not mixed: a group either holds games (free, can't be spun while a
 * game is being played) or holds changes (costs a resource set by an admin).
 */
export type WheelGroup = {
	id: number
	name: string
	kind: 'games' | 'changes'
	entries: WheelEntry[]
}

export type WheelSource = 'wishlist' | { groupId: number }

export type WheelSpinResult = {
	source: WheelSource
	/** reel order, the animation stops at resultIndex */
	entries: string[]
	resultIndex: number
	result: WheelEntry
	spinId: number
}

// 5. Resources

export type PointType = {
	id: number
	name: string
	/** nominative forms for 1 / 2-4 / 5+, e.g. билет / билета / билетов */
	unitForms: [one: string, few: string, many: string]
}

export type PointsLeaderboard = {
	typeId: number
	rows: { player: PlayerRef; value: number }[]
}

export type ItemStack = {
	/** id of the item in the catalogue */
	id: number
	name: string
	/** what will happen: «+50 золота» */
	description: string
	held: number
	usesLeft: number
	usesMax: number
}

export type Perk = {
	id: number
	name: string
	effect: { name: string; text: string }
	kind: 'active' | 'passive'
	/** active perks only */
	usesLeft?: number
	usesMax?: number
}

export type Effect = {
	id: number
	name: string
	description: string
	/** «предмет «Щит» · ты», «колесо · Бонусы» */
	source: string
	/** null = no expiry */
	expiresAt: ISODate | null
	usesLeft?: number
	usesMax?: number
}

export type PlayerResources = {
	player: PlayerRef
	/** by the id of the point type */
	points: Record<number, number>
	items: ItemStack[]
	perks: Perk[]
	effects: Effect[]
}

export type ResourceKind = 'items' | 'perks' | 'effects'

export type ResourceSummary = { login: Login; count: number }

export type ResourceHistoryRow = { at: ISODate; source: string; delta: string }

// 6. Journal

export type JournalSourceKind =
	| 'item'
	| 'perk'
	| 'wheel'
	| 'exchange'
	| 'timer'
	| 'completion'
	| 'grant'
	| 'manual'

export type JournalEntry = {
	id: number
	at: ISODate
	actor: Login | 'admin'
	source: { kind: JournalSourceKind; label: string }
	/** badge «вручную» */
	manual: boolean
	changes: { player: Login | 'all'; text: string; resource?: ResourceRef }[]
}

export type JournalQuery = {
	/** actor or any of the changed players */
	player?: Login | 'admin'
	/** a point type, an item, a perk or an effect; no id means any of that kind */
	resource?: { kind: ResourceRef['kind']; id?: number }
	source?: JournalSourceKind
	period?: 'today' | 'week'
	limit?: number
	cursor?: string
}

export type JournalPage = { items: JournalEntry[]; nextCursor?: string }

// 7. Members

export type Member = {
	player: PlayerRef
	status: PlayerStatus
	currentGame: string | null
	/** the timer of other players is not available */
	playedSeconds: Seconds
	completedCount: number
	spinsCount: number
}

// 8. Exchanges

export type Exchange = {
	id: number
	name: string
	description: string
	give: ResourceRef[]
	get: ResourceRef[]
	available: boolean
	unavailableReason?: 'insufficient' | 'perk_owned'
}

// Backend addresses (localhost:8080/scalar) are noted as "Backend:" above the
// methods that have a counterpart. `{party}` stands for `/parties/{partyId}`,
// every address except /auth/* lives under it. Methods without a "Backend:"
// line have no counterpart yet. The backend returns ISO 8601 durations
// ("PT2h10m5s"), and its create/use endpoints answer with an empty body, so
// the http implementation has to refetch and adapt the shapes.

export type Api = {
	auth: {
		/** Backend: POST /auth/signup (the body also needs `email`) */
		signUp: (data: Credentials) => Promise<void>
		/** Backend: POST /auth/login (session cookie) */
		logIn: (data: Credentials) => Promise<void>
		/** Backend: POST /auth/logout */
		logOut: () => Promise<void>
	}
	session: {
		/**
		 * Backend: GET {party}/members. The login comes from persistentStorage
		 * (StoreKey.Login), isAdmin from the member list, colorIndex is client-side.
		 */
		getMe: () => Promise<Me>
		getSeason: () => Promise<Season>
	}
	currentGame: {
		/**
		 * Backend: GET {party}/games/users/{login}/current, the reward from
		 * GET {party}/rewards/game (missing, the Rewards group is going to replace
		 * /timers/reward as well). The answer has to say explicitly that there is
		 * no current game (not 404).
		 */
		get: () => Promise<CurrentGame>
		/** Backend: POST {party}/games/current/actions {action: 'finish'} */
		complete: () => Promise<{
			granted: ResourceRef[]
			journalEntry: JournalEntry
		}>
		/** Backend: POST {party}/games/current/actions {action: 'cancel'} */
		cancel: () => Promise<void>
		/**
		 * cancels the current game with the status `rerolled`, a new game is spun
		 * with a separate wheel.spin afterwards
		 *
		 * Backend (missing): `reroll` in the actions of
		 * POST {party}/games/current/actions
		 */
		reroll: () => Promise<void>
	}
	timer: {
		/**
		 * Backend: GET {party}/timers/current, reward from
		 * GET {party}/rewards/timer (moved from /timers/reward)
		 */
		get: () => Promise<Timer>
		/**
		 * Backend: POST {party}/timers/current/start, an idle timer has to be
		 * created first with POST {party}/timers/current
		 */
		start: () => Promise<Timer>
		/** Backend: POST {party}/timers/current/pause */
		pause: () => Promise<Timer>
	}
	wishlist: {
		/** Backend: GET {party}/games/users/{login}/wishlist */
		list: (login: Login) => Promise<WishlistGame[]>
		/**
		 * also used to add a game to another player's wishlist; 409 DUPLICATE
		 *
		 * Backend: POST {party}/games/users/{login}/wishlist
		 */
		add: (login: Login, name: string) => Promise<WishlistGame>
		/**
		 * Backend (missing): PATCH {party}/games/users/{login}/wishlist/{id} with
		 * {name}. The entries also have to return `addedDate` and `addedBy`, and
		 * POST has to answer with the created entry.
		 */
		rename: (id: number, name: string) => Promise<WishlistGame>
		/** Backend (missing): DELETE {party}/games/users/{login}/wishlist/{id} */
		remove: (id: number) => Promise<void>
	}
	completed: {
		/** Backend: GET {party}/games/users/{login}/history (events, not games) */
		list: (login: Login) => Promise<CompletedGame[]>
		/**
		 * Backend: PUT {party}/games/reviews/{name}, read back with
		 * GET {party}/games/reviews/{name}
		 */
		saveReview: (id: number, review: Review) => Promise<CompletedGame>
	}
	wheel: {
		// The game wheel has no counterpart on the backend: /wheel-effects/* is a
		// different wheel that rolls effects (rows with a name and a description).
		// Backend (rename): /wheel-effects/* has to be renamed to /wheel/*, the
		// game wheel endpoints below live under the same prefix.

		/**
		 * Backend (missing): GET {party}/wheel/groups returning
		 * [{id, name, kind, entries: [{id, name, description?, isManualChange,
		 * entries}]}].
		 */
		groups: () => Promise<WheelGroup[]>
		/**
		 * The result is stored on the server, so it never has to be cancelled:
		 * dropping a shown result and spinning again is a reroll (`isReroll`,
		 * free). A game can't be spun while a game is being played (409).
		 *
		 * Backend (missing): POST {party}/wheel/spin with
		 * {source: 'wishlist' | {groupId}, isReroll?}. The wishlist spin takes the
		 * games of the current player. The answer carries the reel order
		 * (`entries`), `resultIndex`, `result` and the `spinId`. Spinning a group
		 * of changes costs the resource that an admin set, GET, PUT and DELETE
		 * {party}/wheel/spin-cost with `entries`.
		 */
		spin: (source: WheelSource, isReroll?: boolean) => Promise<WheelSpinResult>
		/**
		 * Backend (missing): POST {party}/wheel/spins/{spinId}/apply. A game spin
		 * starts the game and removes the wishlist entry, a spin of changes
		 * applies its `entries` and tells whether the manual form is needed.
		 */
		apply: (spinId: number) => Promise<{
			currentGame?: CurrentGame
			journalEntry?: JournalEntry
		}>
	}
	resources: {
		/** Backend: GET {party}/points/types */
		pointTypes: () => Promise<PointType[]>
		/** Backend: GET {party}/points/users (sorted by the client) */
		leaderboard: (typeId: number) => Promise<PointsLeaderboard>
		/**
		 * Backend: GET {party}/points/users/{login}, GET {party}/items/{login},
		 * GET {party}/perks/{login}, GET {party}/effects/{login}
		 */
		player: (login: Login) => Promise<PlayerResources>
		/**
		 * No aggregate on the backend, one request per player to
		 * GET {party}/items|perks|effects/{login}
		 */
		summary: (kind: ResourceKind) => Promise<ResourceSummary[]>
		/**
		 * An item has no target: it works on the current player, and when
		 * something else is needed the manual change form is opened
		 * (POST {party}/grants).
		 *
		 * Backend: POST {party}/items/{login}/{userItemId}/use
		 */
		useItem: (itemId: number) => Promise<{ journalEntry: JournalEntry }>
		/** Backend (missing): POST {party}/perks/{login}/{perkId}/use, 204 */
		usePerk: (perkId: number) => Promise<{ journalEntry: JournalEntry }>
		/**
		 * Backend: GET {party}/points/users/{login}/types/{id}/history,
		 * GET {party}/items/{login}/history, GET {party}/perks/{login}/history,
		 * GET {party}/effects/{login}/history (filtered by id on the client)
		 */
		history: (
			login: Login,
			kind: ResourceKind,
			id: number,
			limit?: number,
		) => Promise<ResourceHistoryRow[]>
	}
	journal: {
		/**
		 * Backend (missing): decided to replace the per-entity histories with one
		 * history endpoint for all entities. Requirements are not agreed yet.
		 */
		list: (query: JournalQuery) => Promise<JournalPage>
	}
	members: {
		/** Backend: GET {party}/members, current games from GET {party}/games/current */
		list: () => Promise<Member[]>
		/** Backend (missing): GET {party}/members/{login}, the same member as in the list */
		get: (login: Login) => Promise<Member>
	}
	exchanges: {
		/** Backend: GET {party}/exchanges/catalog */
		list: () => Promise<Exchange[]>
		/** Backend: POST {party}/exchanges/catalog/{id}/use */
		execute: (id: number) => Promise<{
			resources: PlayerResources
			journalEntry: JournalEntry
		}>
	}
}

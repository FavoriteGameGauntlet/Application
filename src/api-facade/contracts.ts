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

/** UI: играет / пауза / крутит колесо / отказ от игры */
export type PlayerStatus = 'playing' | 'paused' | 'rolling' | 'dropped'

export type TimerState = 'running' | 'paused' | 'idle'

export type ResourceRef =
	| { kind: 'points'; type: string; amount: number }
	| { kind: 'item'; name: string; amount: number }
	| { kind: 'perk'; name: string }
	| { kind: 'effect'; name: string; duration?: Seconds }

export type ApiError = { code: string; message: string }

// 1. Auth and session

export type Credentials = { login: Login; password: string }

export type Me = PlayerRef & { isAdmin: boolean }

export type Season = {
	id: string
	name: string
	startsAt: ISODate
	endsAt: ISODate
}

// 2. Current game and timer

export type Reward = { label: string; value: string }[]

export type CurrentGame = {
	game: { id: string; name: string } | null
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
	id: string
	name: string
	addedAt: ISODate
	addedBy?: Login
}

export type CompletedGameStatus = 'completed' | 'cancelled' | 'rerolled'

export type CompletedGame = {
	id: string
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

export type WheelEntry = { id: string; name: string; description?: string }

export type WheelGroup = { id: string; name: string; entries: WheelEntry[] }

export type WheelSource = 'wishlist' | { groupId: string }

export type WheelSpinResult = {
	source: WheelSource
	/** reel order, the animation stops at resultIndex */
	entries: string[]
	resultIndex: number
	result: WheelEntry
	/** "Вручную · применяет админ после прокрута" */
	requiresAdmin: boolean
	spinId: string
}

// 5. Resources

export type PointType = {
	name: string
	/** nominative forms for 1 / 2-4 / 5+, e.g. билет / билета / билетов */
	unitForms: [one: string, few: string, many: string]
}

export type PointsLeaderboard = {
	type: string
	rows: { player: PlayerRef; value: number }[]
}

export type ItemStack = {
	name: string
	/** what will happen: «+50 золота» */
	description: string
	held: number
	/** per week */
	usesLeft: number
	usesMax: number
	needsTarget: boolean
}

export type Perk = {
	name: string
	effect: { name: string; text: string }
	kind: 'active' | 'passive'
	/** active perks only, per week */
	usesLeft?: number
	usesMax?: number
}

export type Effect = {
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
	points: Record<string, number>
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
	id: string
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
	/** 'points:<type>' or 'effect' */
	resource?: string
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
	timer: { state: TimerState; elapsed: Seconds }
	playedSeconds: Seconds
	completedCount: number
	spinsCount: number
}

// 8. Exchanges

export type Exchange = {
	id: string
	name: string
	description: string
	give: ResourceRef[]
	get: ResourceRef[]
	available: boolean
	unavailableReason?: 'insufficient' | 'perk_owned'
}

export type Api = {
	auth: {
		signUp: (data: Credentials) => Promise<void>
		logIn: (data: Credentials) => Promise<void>
		logOut: () => Promise<void>
	}
	session: {
		getMe: () => Promise<Me>
		getSeason: () => Promise<Season>
	}
	currentGame: {
		get: () => Promise<CurrentGame>
		complete: () => Promise<{
			granted: ResourceRef[]
			journalEntry: JournalEntry
		}>
		cancel: () => Promise<void>
		/** marks the current game as rerolled and spins the wishlist */
		reroll: () => Promise<WheelSpinResult>
	}
	timer: {
		get: () => Promise<Timer>
		start: () => Promise<Timer>
		pause: () => Promise<Timer>
	}
	wishlist: {
		list: (login: Login) => Promise<WishlistGame[]>
		/** also used to add a game to another player's wishlist; 409 DUPLICATE */
		add: (login: Login, name: string) => Promise<WishlistGame>
		rename: (id: string, name: string) => Promise<WishlistGame>
		remove: (id: string) => Promise<void>
	}
	completed: {
		list: (login: Login) => Promise<CompletedGame[]>
		saveReview: (id: string, review: Review) => Promise<CompletedGame>
	}
	wheel: {
		groups: () => Promise<WheelGroup[]>
		spin: (source: WheelSource) => Promise<WheelSpinResult>
		apply: (spinId: string) => Promise<{
			currentGame?: CurrentGame
			journalEntry?: JournalEntry
		}>
		discard: (spinId: string) => Promise<void>
	}
	resources: {
		pointTypes: () => Promise<PointType[]>
		leaderboard: (type: string) => Promise<PointsLeaderboard>
		player: (login: Login) => Promise<PlayerResources>
		summary: (kind: ResourceKind) => Promise<ResourceSummary[]>
		useItem: (
			name: string,
			target?: Login,
		) => Promise<{ journalEntry: JournalEntry }>
		usePerk: (name: string) => Promise<{ journalEntry: JournalEntry }>
		history: (
			login: Login,
			kind: ResourceKind,
			name: string,
			limit?: number,
		) => Promise<ResourceHistoryRow[]>
	}
	journal: {
		list: (query: JournalQuery) => Promise<JournalPage>
	}
	members: {
		list: () => Promise<Member[]>
		get: (login: Login) => Promise<Member>
	}
	exchanges: {
		list: () => Promise<Exchange[]>
		execute: (id: string) => Promise<{
			resources: PlayerResources
			journalEntry: JournalEntry
		}>
	}
}

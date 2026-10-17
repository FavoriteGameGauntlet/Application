// Types of the new backend API. Dates are ISO 8601, durations are seconds,
// all display formatting ("2 ч", "сегодня 14:20") is done by the client.

export type Login = string
export type ISODate = string
export type Seconds = number

export type UserRef = {
	login: Login
	/** 1..8 → --user-N */
	colorIndex: number
}

/**
 * UI: играет / на паузе / не в сети. Offline means the app is not running,
 * closing the app pauses the timer.
 */
export type UserStatus = 'playing' | 'paused' | 'offline'

/** `created` is a timer that is not started yet: the server creates it when a game starts */
export type TimerState = 'created' | 'running' | 'paused'

/** every entity is identified by an integer id, the name is only for display */
export type ResourceRef =
	| { kind: 'points'; id: number; name: string; amount: number }
	| { kind: 'item'; id: number; name: string; amount: number }
	| { kind: 'perk'; id: number; name: string }
	| { kind: 'effect'; id: number; name: string; duration?: Seconds }

/**
 * What a spin of changes costs. Points, items, perks and effects are taken the
 * same way: `amount` is how many of the resource are taken, always positive
 * (a perk or an effect is held once, so its amount is 1).
 */
export type SpinCostRef = {
	kind: 'points' | 'item' | 'perk' | 'effect'
	id: number
	name: string
	amount: number
}

export type ApiError = { code: string; message: string }

// 1. Auth and session

export type Credentials = { login: Login; password: string }

export type SignUpData = Credentials & { email: string }

export type Me = UserRef & { isAdmin: boolean }

/** a season is a party on the backend */
export type Season = {
	id: number
	name: string
}

// 2. Current game and timer

export type Reward = { label: string; value: string }[]

export type CurrentGame = {
	/** the id is the id of the party game, the same for all users */
	game: { id: number; name: string } | null
	playedSeconds: Seconds
	completionReward: Reward
}

export type Timer = {
	state: TimerState
	/** left at lastActionDate; a running timer keeps counting down from there */
	remainingTime: Seconds
	duration: Seconds
	/** the last start or pause */
	lastActionDate: ISODate
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
	/** the id of the party game; a user can pick a game only once, so it is the key of the row */
	gameId: number
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
	/** charged when a spin of the group is applied; empty for the games and for a free group */
	cost: SpinCostRef[]
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
	description: string
	/** nominative forms for 1 / 2-4 / 5+, e.g. билет / билета / билетов */
	unitForms: [one: string, few: string, many: string]
	startValue: number
	/** false: only the admins of the party see the type and its values */
	isPublic: boolean
	/** the points belong to the party, not to a user */
	isShared: boolean
	/** null = no lower bound */
	minimum: number | null
	/** null = no upper bound */
	maximum: number | null
}

export type PointsLeaderboard = {
	typeId: number
	rows: { user: UserRef; value: number }[]
}

/** one copy of an item, a user can hold several copies of the same item */
export type UserItem = {
	/** id of the copy */
	id: number
	/** id of the item in the catalogue */
	itemId: number
	name: string
	/** what will happen: «+50 золота» */
	description: string
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

export type UserResources = {
	user: UserRef
	/** by the id of the point type */
	points: Record<number, number>
	items: UserItem[]
	perks: Perk[]
	effects: Effect[]
}

export type ResourceKind = 'items' | 'perks' | 'effects'

export type ResourceSummary = { login: Login; count: number }

/** an item, a perk or an effect that can be given or taken by hand */
export type CatalogOption = { id: number; name: string }

export type ResourceHistoryRow = { at: ISODate; source: string; delta: string }

// 6. Journal

/** the `Type` of the root history event on the backend */
export type JournalSourceType =
	| 'item'
	| 'perk'
	| 'effect'
	| 'wheel_row'
	| 'exchange'
	| 'manual'
	| 'timer'
	| 'game'

export type JournalSource = {
	type: JournalSourceType
	/** the item, the perk, the effect, the exchange, the wheel row or the game */
	id?: number
	/** the name of the entity above, a manual change has none */
	name?: string
	/** game only: what happened to the game */
	event?: 'started' | CompletedGameStatus
}

export type JournalEntry = {
	id: number
	at: ISODate
	actor: Login
	source: JournalSource
	/** badge «вручную» */
	manual: boolean
	/** set on an entry that corrects another one, the corrected entry stays as it was */
	correctsEntryId?: number
	/** empty for a game that was started, cancelled or rerolled */
	changes: {
		/** null for the shared points of the party */
		login: Login | null
		text: string
		resource?: ResourceRef
	}[]
}

export type JournalQuery = {
	/** actor or any of the changed users, no login = all users of the party */
	user?: Login
	/** a point type, an item, a perk or an effect; no id means any of that kind */
	resource?: { kind: ResourceRef['kind']; id?: number }
	source?: JournalSourceType
	from?: ISODate
	to?: ISODate
	limit?: number
	cursor?: string
}

export type JournalPage = { items: JournalEntry[]; nextCursor?: string }

// 7. Members

export type Member = {
	user: UserRef
	status: UserStatus
	currentGame: string | null
	/** the timer of other users is not available */
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

// 9. Manual changes

/** a change of one user made by hand: the wheel entry with `isManualChange` or a journal correction */
export type ManualChange =
	| { user: Login; kind: 'points'; id: number; delta: number }
	/** the shared points of the party have no user */
	| { kind: 'shared-points'; id: number; delta: number }
	| { user: Login; kind: 'item'; id: number; delta: number }
	| { user: Login; kind: 'perk'; id: number; op: 'grant' | 'revoke' }
	| {
			user: Login
			kind: 'effect'
			id: number
			op: 'grant' | 'revoke'
			duration?: Seconds
	  }

export type ManualRequest = {
	/** at least one */
	changes: ManualChange[]
	/** correction of a journal entry, the entry itself is not changed */
	correctsEntryId?: number
	/** the wheel spin whose `isManualChange` entry is being applied */
	spinId?: number
}

// 10. Parties

export type PartyRole = 'admin' | 'user'

/** a party is the same thing as a season */
export type Party = {
	id: number
	name: string
	membersCount: number
	startsAt: ISODate
	endsAt: ISODate
	status: 'active' | 'finished'
	/** the role of the current user in this party */
	role: PartyRole
	current: boolean
}

// 11. Admin panel (admins of the party only)

export type CatalogKind = 'point-types' | 'items' | 'effects' | 'perks'

export type CatalogEntry = {
	id: number
	name: string
	description: string
	/** soft delete: hidden from the users, the history stays */
	deleted: boolean
	/** point-types */
	unitForms?: [one: string, few: string, many: string]
	/** point-types */
	startValue?: number
	/** point-types */
	isPublic?: boolean
	/** point-types */
	isShared?: boolean
	/** point-types, null = no lower bound */
	minimum?: number | null
	/** point-types, null = no upper bound */
	maximum?: number | null
	/** items, effects, perks: «+50 Золото», «блок негативных предметов» */
	changes?: string[]
	/** effects, null = no expiry */
	duration?: Seconds | null
	/** items: more than zero; effects: null = unlimited */
	usesMax?: number | null
	/** perks */
	perkKind?: 'active' | 'passive'
	/** read only: «Всего у игроков» / «У игроков» */
	holdersTotal?: number
}

export type CatalogEntryInput = Omit<CatalogEntry, 'id' | 'deleted' | 'holdersTotal'>

export type AdminExchange = {
	id: number
	name: string
	description: string
	give: ResourceRef[]
	get: ResourceRef[]
	deleted: boolean
}

export type AdminWheelEntry = {
	id: number
	name: string
	description?: string
	/** free text until the picker of resources is drawn; empty = the user makes the change by hand */
	changes: string[]
}

export type AdminWheelGroup = {
	id: number
	name: string
	kind: WheelGroup['kind']
	/** the wishlist group: the entries are the games of the users, nothing to edit */
	system: boolean
	noRepeat: boolean
	entries: AdminWheelEntry[]
}

export type RewardRow = {
	kind: 'points' | 'item' | 'effect'
	/** id of the point type, item or effect */
	targetId: number
	/** «+50», «1 день» for an effect */
	amount: string
}

export type Rewards = { timer: RewardRow[]; game: RewardRow[] }

export type SpinCostRow = {
	kind: SpinCostRef['kind']
	/** id of the point type, item, perk or effect */
	targetId: number
	/** positive, the backend keeps it as a negative change */
	amount: number
}

/**
 * What the user gives for a spin of changes: the ids of the chosen copies of the
 * items, of the perks and of the effects. Points are not chosen.
 */
export type SpinPayment = { items: number[]; perks: number[]; effects: number[] }

export type PartyMember = {
	login: Login
	displayName: string | null
	joinedAt: ISODate
	isAdmin: boolean
}

export type SystemParam = {
	key: string
	title: string
	hint: string
	value: string
	default: string
	unit: string
}

// Backend addresses (localhost:8080/scalar) are noted as "Backend:" above the
// methods that have a counterpart. `{party}` stands for `/parties/{partyId}`,
// every address except /auth/* lives under it. Methods without a "Backend:"
// line have no counterpart yet. The backend returns ISO 8601 durations
// ("PT2h10m5s"), and its create/use endpoints answer with an empty body, so
// the http implementation has to refetch and adapt the shapes.

export type Api = {
	auth: {
		/** Backend: POST /auth/signup (the email is not confirmed) */
		signUp: (data: SignUpData) => Promise<void>
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
		 * Backend: POST {party}/timers/current/start. The timer is created by the
		 * server when a game starts (wheel.apply), the client doesn't create it.
		 */
		start: () => Promise<Timer>
		/** Backend: POST {party}/timers/current/pause */
		pause: () => Promise<Timer>
	}
	wishlist: {
		/** Backend: GET {party}/games/users/{login}/wishlist */
		list: (login: Login) => Promise<WishlistGame[]>
		/**
		 * also used to add a game to another user's wishlist; 409 DUPLICATE,
		 * 409 ALREADY_PICKED when that user has already picked the game (it is
		 * current or in the history with any status): a game can't be picked twice
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
		 * Backend (missing): PUT {party}/games/{gameId}/review for the current
		 * user with {rating, reviewComment}, the reviews of all users are
		 * read with GET {party}/games/{gameId}/reviews. Any game from the history
		 * can be rated, whatever its end state; 404 when the game is not there.
		 */
		saveReview: (gameId: number, review: Review) => Promise<CompletedGame>
	}
	wheel: {
		// The game wheel has no counterpart on the backend: /wheel-effects/* is a
		// different wheel that rolls effects (rows with a name and a description).
		// Backend (rename): /wheel-effects/* has to be renamed to /wheel/*, the
		// game wheel endpoints below live under the same prefix.

		/**
		 * Backend (missing): GET {party}/wheel/groups returning
		 * [{id, name, kind, cost, entries: [{id, name, description?,
		 * isManualChange, entries}]}], `cost` is the spin cost of the group.
		 */
		groups: () => Promise<WheelGroup[]>
		/**
		 * A spin is free and writes nothing to the history: the result is only
		 * stored on the server and the next spin replaces it, so there is no
		 * reroll flag. A game can't be spun while a game is being played (409). A
		 * spin of changes checks that the cost of `apply` can be paid (409
		 * INSUFFICIENT).
		 *
		 * Backend (missing): POST {party}/wheel/spin with
		 * {source: 'wishlist' | {groupId}}. The wishlist spin takes the games of
		 * the current user. The answer carries the reel order (`entries`),
		 * `resultIndex`, `result` and the `spinId`. The cost of a spin of changes
		 * is set by an admin, GET, PUT and DELETE {party}/wheel/spin-cost with
		 * `entries`.
		 */
		spin: (source: WheelSource) => Promise<WheelSpinResult>
		/**
		 * The cost of a spin of changes is charged here, in one history record
		 * with the changes of the result (409 INSUFFICIENT). A game that the user
		 * has already picked can fall but can't be applied (409 ALREADY_PICKED).
		 *
		 * `payment` is what the user chose to give when the cost can be paid with
		 * different copies (items of different wear): 409 INVALID_PAYMENT when it
		 * doesn't fit the cost. Without it the server takes the most used copies.
		 *
		 * Backend (missing): POST {party}/wheel/spins/{spinId}/apply. A game spin
		 * starts the game, creates its timer and removes the wishlist entry, a
		 * spin of changes applies its `entries` and tells whether the manual form
		 * is needed.
		 */
		apply: (spinId: number, payment?: SpinPayment) => Promise<{
			currentGame?: CurrentGame
			journalEntry?: JournalEntry
		}>
	}
	resources: {
		/**
		 * Both personal and shared types (`isShared`), the client splits them. The
		 * types with `isPublic = false` come only for the admins of the party.
		 *
		 * Backend: GET {party}/points/types (add `description`, `unitForms`; the
		 * `isPublic` filter on the backend)
		 */
		pointTypes: () => Promise<PointType[]>
		/**
		 * Values of the shared points by the id of the point type; they are
		 * changed with the manual change form.
		 *
		 * Backend: GET {party}/points/party, changed with
		 * POST/PUT {party}/points/party/types/{id}
		 */
		sharedPoints: () => Promise<Record<number, number>>
		/** Backend: GET {party}/points/users (sorted by the client) */
		leaderboard: (typeId: number) => Promise<PointsLeaderboard>
		/**
		 * Backend: GET {party}/points/users/{login}, GET {party}/items/{login},
		 * GET {party}/perks/{login}, GET {party}/effects/{login}
		 */
		user: (login: Login) => Promise<UserResources>
		/**
		 * No aggregate on the backend, one request per user to
		 * GET {party}/items|perks|effects/{login}
		 */
		summary: (kind: ResourceKind) => Promise<ResourceSummary[]>
		/**
		 * The catalogue of the party without the deleted entries; the manual
		 * change form picks the resource from it.
		 *
		 * Backend: GET {party}/items, GET {party}/perks, GET {party}/effects
		 */
		catalog: (kind: ResourceKind) => Promise<CatalogOption[]>
		/**
		 * An item has no target: it works on the current user, and when
		 * something else is needed the manual change form is opened
		 * (POST {party}/grants).
		 *
		 * Backend: POST {party}/items/{login}/{userItemId}/use. The id is the id
		 * of the copy; a copy with no uses left is gone. `usesMax` comes from the
		 * backend (`useCount` of the catalogue renamed to `usesMax`, and added to
		 * the copy).
		 */
		useItem: (userItemId: number) => Promise<{ journalEntry: JournalEntry }>
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
		 * Backend (missing): one history endpoint for all entities replaces the
		 * per-entity histories, GET {party}/history built on users.HistoryEvents.
		 * The items are the root events (`Type` is the source type, game events
		 * included) with their point changes nested; limit and cursor count the
		 * roots. Ids come with names (`source.id` + `source.name`, `resource.id` +
		 * `resource.name`). The types of points with `isPublic = false` are left
		 * out of the answer for everyone but the admins. `from` and `to` are
		 * moments of time.
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
			resources: UserResources
			journalEntry: JournalEntry
		}>
	}
	manual: {
		/**
		 * Any user can make a manual change. Validation: an item can't go below
		 * zero (409 INSUFFICIENT), a perk or an effect that isn't owned can't be
		 * revoked (409 NOT_OWNED).
		 *
		 * Backend: POST {party}/grants with `targetLogins` and `entries` (no
		 * perks, effects, `correctsEntryId` and `spinId` there yet). The entry in
		 * the journal gets `manual: true`.
		 */
		apply: (request: ManualRequest) => Promise<{ journalEntry: JournalEntry }>
	}
	parties: {
		/**
		 * Backend: GET /parties gives `id`, `name` and `createdDate` only; the
		 * members count, the dates, the status and the role are missing.
		 */
		list: () => Promise<Party[]>
		/**
		 * Everything after it is in the context of this party. On the backend the
		 * party id is part of every address, so the http implementation keeps the
		 * choice on the client instead.
		 */
		select: (id: number) => Promise<void>
	}
	admin: {
		// Backend (missing): the whole admin panel. The catalogs correspond to
		// the create/update/delete addresses of points/types, items, effects and
		// perks, the soft delete and the restore are missing there.
		catalog: {
			/** GET /admin/catalog/{kind}?includeDeleted= */
			list: (kind: CatalogKind, includeDeleted: boolean) => Promise<CatalogEntry[]>
			create: (kind: CatalogKind, input: CatalogEntryInput) => Promise<CatalogEntry>
			update: (
				kind: CatalogKind,
				id: number,
				input: CatalogEntryInput,
			) => Promise<CatalogEntry>
			/** soft delete */
			remove: (kind: CatalogKind, id: number) => Promise<void>
			restore: (kind: CatalogKind, id: number) => Promise<void>
		}
		exchanges: {
			list: (includeDeleted: boolean) => Promise<AdminExchange[]>
			/** the give and get sides of an exchange are not editable in the design yet */
			create: (input: { name: string; description: string }) => Promise<AdminExchange>
			update: (
				id: number,
				input: { name: string; description: string },
			) => Promise<AdminExchange>
			remove: (id: number) => Promise<void>
			restore: (id: number) => Promise<void>
		}
		wheel: {
			groups: (kind: WheelGroup['kind']) => Promise<AdminWheelGroup[]>
			createGroup: (kind: WheelGroup['kind'], name: string) => Promise<AdminWheelGroup>
			renameGroup: (groupId: number, name: string) => Promise<void>
			setNoRepeat: (groupId: number, noRepeat: boolean) => Promise<void>
			removeGroup: (groupId: number) => Promise<void>
			/** adds the entry, or updates it when `entryId` is given */
			saveEntry: (
				groupId: number,
				entryId: number | undefined,
				input: Pick<AdminWheelEntry, 'name' | 'description' | 'changes'>,
			) => Promise<void>
			removeEntry: (groupId: number, entryId: number) => Promise<void>
			/**
			 * Every group of changes has a cost of its own, the games are free. An
			 * empty list makes a spin of the group free.
			 *
			 * Backend (missing): GET and PUT {party}/wheel/groups/{groupId}/spin-cost
			 * with `entries` (negative amounts there)
			 */
			spinCost: (groupId: number) => Promise<SpinCostRow[]>
			saveSpinCost: (groupId: number, rows: SpinCostRow[]) => Promise<void>
		}
		rewards: {
			get: () => Promise<Rewards>
			/** only affects the timers and games that start after it */
			save: (rewards: Rewards) => Promise<void>
		}
		members: {
			list: () => Promise<PartyMember[]>
			/** 404 USER_NOT_FOUND, 409 ALREADY_MEMBER */
			add: (login: Login) => Promise<PartyMember>
			/** 409 LAST_ADMIN when the last admin is demoted */
			update: (
				login: Login,
				input: { displayName: string | null; isAdmin: boolean },
			) => Promise<PartyMember>
			/** 409 LAST_ADMIN */
			remove: (login: Login) => Promise<void>
		}
		params: {
			list: () => Promise<SystemParam[]>
			set: (key: string, value: string) => Promise<SystemParam>
			/** back to the default value */
			reset: (key: string) => Promise<SystemParam>
		}
	}
}

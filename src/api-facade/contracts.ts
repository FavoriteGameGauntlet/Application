// Types of the new backend API. Dates are ISO 8601, durations are seconds,
// all display formatting ("2 ч", "сегодня 14:20") is done by the client.

export type Login = string
export type ISODate = string
export type Seconds = number

export type UserRef = {
	login: Login
	/** the color the client chose when the member joined, lowercase hex: `#ffb000` */
	color: string
}

/**
 * UI: играет / на паузе / не в сети. Offline means the app is not running,
 * closing the app pauses the timer.
 */
export type UserStatus = 'playing' | 'paused' | 'offline'

/** `created` is a timer that is not started yet: the server creates it when a game starts */
export type TimerState = 'created' | 'running' | 'paused'

/** every entity is identified by an integer id, the name is only for display */
export type ResourceRef = (
	| { kind: 'points'; id: number; name: string; amount: number }
	| { kind: 'item'; id: number; name: string; amount: number }
	| { kind: 'perk'; id: number; name: string }
	| { kind: 'effect'; id: number; name: string; duration?: Seconds }
) & {
	/**
	 * the id of the entry among the entries of its change; a user who picks the
	 * entries to apply (`shouldApplyToAll` is false) names them by it
	 */
	entryId?: number
	/** the entry with its sign as text («−1 золото»), set where the user picks among entries and the amount alone would hide the sign */
	text?: string
}

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
	/** left at the moment of the response; a running timer keeps counting down from there */
	remainingTime: Seconds
	duration: Seconds
	/** the last start or pause */
	lastActionDate: ISODate
}

// 3. Wishlist and completed games

export type WishlistEntry = {
	id: number
	name: string
	addedDate: ISODate
	addedBy?: Login
}

export type GameEndState = 'completed' | 'cancelled' | 'rerolled'

export type GameHistoryEntry = {
	/** the id of the party game; a user can pick a game only once, so it is the key of the row */
	gameId: number
	name: string
	startedDate: ISODate
	endedDate: ISODate
	timeSpent: Seconds
	endState: GameEndState
	/** 1..10 */
	rating: number | null
	reviewComment: string | null
}

export type GameReview = { rating: number; reviewComment: string }

// 4. Wheel

export type WheelEntry = {
	id: number
	name: string
	description?: string
	/** the manual change form has to be opened after the entry is applied */
	isManualChange?: boolean
	/** false: the user picks which of `entries` to apply; changes only */
	shouldApplyToAll?: boolean
	/** changes that are applied automatically, there may be some next to isManualChange */
	entries?: ResourceRef[]
}

/**
 * Groups are not mixed: a group holds games or changes. A spin of a group of
 * games can't be made while a game is being played, and applying it starts the
 * game. The `wishlist` is the group of games of the current user, its games are
 * in the wishlist (`entries` hold nothing). Any group can have a cost set by an
 * admin.
 */
export type WheelGroup = {
	id: number
	name: string
	kind: 'wishlist' | 'games' | 'changes'
	entries: WheelEntry[]
	/** charged when a spin of the group is applied; empty for a free group */
	cost: SpinCostRef[]
}

export type WheelSource = { groupId: number }

export type WheelSpinResult = {
	source: WheelSource
	/** reel order, the animation stops at resultIndex */
	entries: string[]
	/** the middle item of the spin, the one that `apply` uses */
	resultIndex: number
	/** the backend saves only the last spin, so the item has no id of its own */
	result: Omit<WheelEntry, 'id'>
}

// 5. Resources

/** nominative forms for 1 / 2-4 / 5+, e.g. билет / билета / билетов */
export type UnitForms = { one: string; several: string; many: string }

export type PointType = {
	id: number
	name: string
	description: string
	unitForms: UnitForms
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
	/** false: the user picks which of the entries to apply, each time */
	shouldApplyToAll: boolean
	/** what using the copy does; decides whether the user names targets and picks copies */
	entries?: ItemEntryRow[]
	/** what has to hold for the item to be used */
	conditions?: ItemCondition[]
}

export type Perk = {
	id: number
	name: string
	description: string
	/** point changes the perk applies while it is held, as text: «+10% золота» */
	modifiers?: string[]
	kind: 'active' | 'passive'
	/** active perks only */
	usesLeft?: number
	usesMax?: number
	/** active perks only: what using the ability does */
	abilityEntries?: ItemEntryRow[]
	/** active perks only, false: the user picks which of the entries to apply */
	abilityShouldApplyToAll?: boolean
}

export type Effect = {
	id: number
	name: string
	description: string
	/** «предмет «Щит» · ты», «колесо · Бонусы» */
	source: string
	/** null = no expiry */
	expiresAt: ISODate | null
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

/**
 * What happened, as the backend names it: `item_added`, `perk_uses_changed`,
 * `game_ended`, `manual_granted`... New kinds can appear, so it is a string
 * and an unknown one is shown as it is.
 */
export type HistoryEventKind = string

export type JournalSource = {
	eventKind: HistoryEventKind
	/** the item, the perk, the effect, the exchange, the wheel row or the game */
	id?: number
	/** the name of the entity above, a manual change and a timer have none */
	name?: string
	/** `game_ended` only: how the game ended */
	endState?: GameEndState
}

export type JournalEntry = {
	id: number
	at: ISODate
	actor: Login
	source: JournalSource
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
	/** an event kind that matches nothing is not an error, it just finds no entries */
	sourceEventKinds?: HistoryEventKind[]
	from?: ISODate
	to?: ISODate
	limit?: number
	cursor?: string
}

export type JournalPage = { items: JournalEntry[]; nextCursor?: string }

// 7. Members

export type Member = {
	user: UserRef
	/** the name the admins of the party gave the member; null = the login is shown */
	displayName: string | null
	status: UserStatus
	currentGame: string | null
	/** the timer of other users is not available */
	playedSeconds: Seconds
	completedCount: number
	spinsCount: number
}

// 8. Exchanges

export type ExchangeOffer = {
	id: number
	name: string
	description: string
	/** what the user gives */
	sourceEntries: ResourceRef[]
	/** what the user gets */
	targetEntries: ResourceRef[]
	/** false: the user picks which of `sourceEntries` to give */
	sourceShouldApplyToAll: boolean
	/** false: the user picks which of `targetEntries` to get */
	targetShouldApplyToAll: boolean
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
}

/**
 * What the user adds to the use of an item or of a perk ability. `targetLogins`
 * are required exactly when an entry acts on the `chosen` users or transfers
 * copies (none of them the holder); `userItemIds` are the copies picked for the
 * entries that take, duplicate or transfer user items, in the order of the
 * entries.
 */
export type ItemUse = {
	/** the `entryId`s to apply; required when `shouldApplyToAll` is false, not accepted otherwise */
	entryIds?: number[]
	targetLogins?: Login[]
	userItemIds?: number[]
}

/** What the user adds to an exchange: who pays, and the entries of a side that doesn't apply to all. */
export type ExchangeUse = {
	/** the users who pay instead of the one making the exchange */
	targetLogins?: Login[]
	sourceEntryIds?: number[]
	targetEntryIds?: number[]
}

/**
 * What the user adds to the apply of a spin: whom the item concerns (a group of
 * changes only), the entries of an item that doesn't apply to all, and the
 * payment of the cost.
 */
export type WheelApply = {
	payment?: SpinPayment
	targetLogins?: Login[]
	entryIds?: number[]
}

// 10. Parties

export type PartyRole = 'admin' | 'user'

/** a party to create: the creator joins it as a member, so they pick their color too */
export type PartyCreateInput = PartyInput & {
	/** lowercase hex: `#ffb000` */
	creatorColor: string
}

export type PartyInput = {
	name: string
	startsAt: ISODate
	/** later than `startsAt` */
	endsAt: ISODate
}

/** a party is the same thing as a season */
export type Party = {
	id: number
	name: string
	membersCount: number
	/** when the party was created */
	createdAt: ISODate
	startsAt: ISODate
	endsAt: ISODate
	status: 'active' | 'finished'
	/** the role of the current user in this party */
	role: PartyRole
	current: boolean
}

// 11. Admin panel (admins of the party only)

export type CatalogKind = 'point-types' | 'items' | 'effects' | 'perks'

/**
 * One thing a change gives or takes. The amount keeps the sign (a cost is
 * negative); a perk or an effect is held once, so its amount is 1 or -1.
 */
export type ChangeRow = {
	kind: 'points' | 'item' | 'perk' | 'effect'
	/** id of the point type, item, perk or effect */
	targetId: number
	amount: number
}

/** whom an entry of an item or of a perk ability acts on */
export type ItemEntryWho = 'self' | 'chosen'

/** One thing using an item or a perk ability does. */
export type ItemEntryRow = {
	/** set on an entry read from the backend, see `ResourceRef.entryId` */
	entryId?: number
	/** the entry as text («+50 золота»), set on the entries of a held item or perk so a user can pick among them */
	text?: string
	/**
	 * `user-item`: no target in the catalogue, the copies are picked when the item
	 * is used. `user-item-transfer`: the picked copies move from one player to
	 * another and stay as they are.
	 */
	kind: ChangeRow['kind'] | 'user-item' | 'user-item-transfer'
	/** not set for `user-item` and `user-item-transfer` */
	targetId?: number
	/** keeps the sign, a negative amount takes; a transfer is always positive and counts the copies moved for each chosen player */
	amount: number
	/**
	 * `chosen` = the users named when the item is used. For a transfer it is the
	 * side that loses the copies: `self` gives them to the chosen players, `chosen`
	 * hands them to the holder.
	 */
	who: ItemEntryWho
}

/** What has to hold for an item to be used, otherwise the use is refused and not spent. */
export type ItemCondition =
	| 'target_not_self'
	| 'target_online'
	| 'target_offline'
	| 'holder_not_playing'

/** A point change an effect or a perk applies passively while it is active. */
export type PointModifierRow = {
	pointTypeId: number
	/** keeps the sign */
	amount: number
}

/** What the holder of a perk can do on their own. */
export type PerkAbility = {
	/** false: the user picks which of the entries to apply, each time */
	shouldApplyToAll: boolean
	entries: ItemEntryRow[]
	/** read only: the text of `entries`, built by the facade from the resource names in the response */
	changes?: string[]
	/** how often it can be used; not set = without limit, then no charges and no renewal */
	uses?: { max: number; start: number }
	/** events that charge the ability: this many give one use; 0 = no charges */
	chargesMax: number
	/** restores the uses to the maximum once this time has passed since they last changed */
	renewalPeriod?: Seconds
}

export type CatalogEntry = {
	id: number
	name: string
	description: string
	/** soft delete: hidden from the users, the history stays */
	deleted: boolean
	/** point-types */
	unitForms?: UnitForms
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
	/** items: more than zero; perks: the most uses of the ability */
	usesMax?: number | null
	/** perks: `active` when the perk has an ability */
	perkKind?: 'active' | 'passive'
	/** items: what using the item does */
	entries?: ItemEntryRow[]
	/** items, false: the user picks which of the entries to apply, each time */
	shouldApplyToAll?: boolean
	/** items */
	conditions?: ItemCondition[]
	/** effects, perks: point changes applied while it is active or held */
	modifiers?: PointModifierRow[]
	/** perks: only an active perk has it */
	ability?: PerkAbility
	/** read only: «Всего у игроков» / «У игроков» */
	holdersTotal?: number
}

/** `changes` is the text of `entries`, `modifiers` and `ability`, the backend builds it */
export type CatalogEntryInput = Omit<
	CatalogEntry,
	'id' | 'deleted' | 'holdersTotal' | 'changes'
>

export type AdminExchange = {
	id: number
	name: string
	description: string
	sourceEntries: ResourceRef[]
	targetEntries: ResourceRef[]
	sourceShouldApplyToAll: boolean
	targetShouldApplyToAll: boolean
	deleted: boolean
}

export type AdminExchangeInput = {
	name: string
	description: string
	/** what the user gives, amounts are positive */
	sourceEntries: SpinCostRow[]
	/** false: the user picks which of the entries to give */
	sourceShouldApplyToAll: boolean
	/** what the user gets, amounts are positive */
	targetEntries: SpinCostRow[]
	/** false: the user picks which of the entries to get */
	targetShouldApplyToAll: boolean
}

export type AdminWheelEntry = {
	id: number
	name: string
	description?: string
	/** the text of `entries`; empty = nothing changes by itself */
	changes: string[]
	/** a change group only: what the item grants to the chosen users, signed */
	entries: ChangeRow[]
	/** the user makes a change by hand after the item fell, see `manual` */
	isManualChange: boolean
	/** false: the user who gets the item picks which of the entries to apply */
	shouldApplyToAll: boolean
}

export type AdminWheelGroup = {
	id: number
	name: string
	kind: Exclude<WheelGroup['kind'], 'wishlist'>
	/** the wishlist group: the entries are the games of the users, nothing to edit */
	system: boolean
	noRepeat: boolean
	entries: AdminWheelEntry[]
}

/**
 * One thing a reward grants, the amount keeps the sign. An effect lasts as long
 * as its catalogue entry says, so a reward has no duration of its own: another
 * duration is another effect.
 */
export type RewardRow = ChangeRow

/**
 * What gives a reward: `timer` a timer of a user ends, `timer_created` a timer
 * is created, `game_completed` / `game_cancelled` / `game_rerolled` a user ends
 * their current game in that way.
 */
export type RewardTrigger =
	| 'timer'
	| 'timer_created'
	| 'game_completed'
	| 'game_cancelled'
	| 'game_rerolled'

export type Rewards = Record<RewardTrigger, RewardRow[]>

/** a setting of the party; the values are text, the backend does not check them */
export type SystemParameter = {
	name: string
	value: string
	defaultValue: string
	/** the party has no value of its own */
	isDefault: boolean
}

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
export type SpinPayment = {
	items: number[]
	perks: number[]
	effects: number[]
}

export type PartyMember = {
	login: Login
	displayName: string | null
	joinedDate: ISODate
	/** null for a current member; a member who left can be restored */
	leftDate: ISODate | null
	isAdmin: boolean
	/** lowercase hex: `#ffb000` */
	color: string
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
		 * (StoreKey.Login), isAdmin and the color from the member list.
		 */
		getMe: () => Promise<Me>
		getSeason: () => Promise<Season>
	}
	currentGame: {
		/**
		 * Backend: GET {party}/games/users/{login}/current (204 when there is no
		 * current game), the reward from GET {party}/rewards/game_completed.
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
		 * Backend: `reroll` in the actions of
		 * POST {party}/games/current/actions
		 */
		reroll: () => Promise<void>
	}
	timer: {
		/** Backend: GET {party}/timer */
		get: () => Promise<Timer>
		/** Backend: GET {party}/rewards/timer. It doesn't need a timer, the reward is the party's setting. */
		reward: () => Promise<Reward>
		/**
		 * Backend: POST {party}/timer/start. The timer is created by the
		 * server when a game starts (wheel.apply), the client doesn't create it.
		 */
		start: () => Promise<Timer>
		/** Backend: POST {party}/timer/pause */
		pause: () => Promise<Timer>
	}
	wishlist: {
		/** Backend: GET {party}/games/users/{login}/wishlist */
		list: (login: Login) => Promise<WishlistEntry[]>
		/**
		 * also used to add a game to another user's wishlist; 409
		 * WISHLIST_GAME_ALREADY_EXISTS, 409 GAME_ALREADY_PICKED when that user has already picked the game (it is
		 * current or in the history with any status): a game can't be picked twice
		 *
		 * Backend: POST {party}/games/users/{login}/wishlist
		 */
		add: (login: Login, name: string) => Promise<WishlistEntry>
		/**
		 * Backend: PATCH {party}/games/users/{login}/wishlist/{id} with {name};
		 * the login is the current user's.
		 */
		rename: (id: number, name: string) => Promise<WishlistEntry>
		/** Backend: DELETE {party}/games/users/{login}/wishlist/{id}, the login is the current user's */
		remove: (id: number) => Promise<void>
	}
	completed: {
		/**
		 * Backend: GET {party}/games/users/{login}/history, one record per game.
		 * The rating and the review of the user come from
		 * GET {party}/games/{gameId}/reviews/{login} (404 = not rated).
		 */
		list: (login: Login) => Promise<GameHistoryEntry[]>
		/**
		 * Backend: PUT {party}/games/{gameId}/review for the current user with
		 * {rating, reviewComment}, the answer is empty so the history is read
		 * again. The reviews of all users are read with
		 * GET {party}/games/{gameId}/reviews. Any game from the history can be
		 * rated, whatever its end state; 404 when the game is not there.
		 */
		saveReview: (
			gameId: number,
			review: GameReview,
		) => Promise<GameHistoryEntry>
	}
	wheel: {
		/**
		 * Backend: GET {party}/wheel/groups, the groups the user can spin (their own
		 * wishlist included) with `cost`, and GET {party}/wheel/groups/{groupId}/rows
		 * for the items of every group but the wishlist.
		 */
		groups: () => Promise<WheelGroup[]>
		/**
		 * A spin is free and writes nothing to the history: the result is only
		 * stored on the server and the next spin replaces it, so there is no
		 * reroll flag. A game can't be spun while a game is being played (409
		 * CURRENT_GAME_ALREADY_EXISTS). A spin checks that the cost of `apply` can
		 * be paid (409 NOT_ENOUGH_POINTS, INVALID_PAYMENT).
		 *
		 * Backend: POST {party}/wheel/spin with {groupId}; the wishlist is a
		 * group of its own, with its id in `groups`. The answer is the saved items in the order they sit
		 * on the wheel (`position` from 1), the middle one is the result. The
		 * cost of a spin of changes is set by an admin, see `admin.wheel.spinCost`.
		 */
		spin: (source: WheelSource) => Promise<WheelSpinResult>
		/**
		 * The spin the server still keeps, null when there is none. The answer
		 * doesn't say which group it came from, so the group is the one whose items
		 * hold every name of the spin.
		 *
		 * Backend: GET {party}/wheel/spins/last, 404 LAST_WHEEL_EFFECTS_NOT_FOUND
		 */
		lastSpin: () => Promise<WheelSpinResult | null>
		/**
		 * Drops the stored spin without applying it; there is no error when there
		 * is none.
		 *
		 * Backend: POST {party}/wheel/spins/last/clear
		 */
		discard: () => Promise<void>
		/**
		 * The cost of a spin of changes is charged here, in one history record
		 * with the changes of the result (409 NOT_ENOUGH_POINTS). A game that the
		 * user has already picked can fall but can't be applied (409
		 * GAME_ALREADY_PICKED).
		 *
		 * `payment` is what the user chose to give when the cost can be paid with
		 * different copies (items of different wear): 409 INVALID_PAYMENT when it
		 * doesn't fit the cost. Without it the server takes the most used copies.
		 * `targetLogins` is required for a group of changes (422
		 * WHEEL_TARGETS_INVALID without it), not allowed for a game or the wishlist.
		 * `entryIds` is required for an item with `shouldApplyToAll` false and not
		 * accepted otherwise (422 WHEEL_ENTRIES_INVALID).
		 *
		 * Backend: POST {party}/wheel/spins/last/apply, the backend applies the
		 * last spin of the user. A game spin starts the game, creates its timer
		 * and removes the wishlist entry, a spin of changes applies its `entries`.
		 */
		apply: (use?: WheelApply) => Promise<{
			currentGame?: CurrentGame
			journalEntry?: JournalEntry
		}>
	}
	resources: {
		/**
		 * Both personal and shared types (`isShared`), the client splits them. The
		 * types with `isPublic = false` come only for the admins of the party.
		 *
		 * Backend: GET {party}/points/types (the `isPublic` filter is on the
		 * backend)
		 */
		pointTypes: () => Promise<PointType[]>
		/**
		 * Values of the shared points by the id of the point type; they are
		 * changed with the manual change form.
		 *
		 * Backend: GET {party}/points/party, changed with
		 * PATCH {party}/points/party/types/{id}
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
		 * Backend: GET {party}/items/catalog, GET {party}/perks/catalog,
		 * GET {party}/effects/catalog
		 */
		catalog: (kind: ResourceKind) => Promise<CatalogOption[]>
		/**
		 * The same catalogue with the descriptions and the changes, for the
		 * «Каталог» screen. The deleted entries never come: the admins get them
		 * from `admin.catalog.list`, the users don't see them at all. The point
		 * types come from `pointTypes`.
		 *
		 * Backend: GET {party}/items/catalog, GET {party}/perks/catalog,
		 * GET {party}/effects/catalog with the full entries (the perk has no kind)
		 */
		catalogEntries: (kind: ResourceKind) => Promise<CatalogEntry[]>
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
		useItem: (
			userItemId: number,
			use?: ItemUse,
		) => Promise<{ journalEntry: JournalEntry }>
		/** Backend: POST {party}/perks/{login}/{perkId}/use, 204 */
		usePerk: (
			perkId: number,
			use?: ItemUse,
		) => Promise<{ journalEntry: JournalEntry }>
		/**
		 * Backend: GET {party}/history of the user filtered by `resource[kind]`
		 * and `resource[id]`, the same endpoint as `journal.list`
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
		 * Backend: GET {party}/history, one endpoint for all entities.
		 * The items are the root events (`source.eventKind` says what happened,
		 * game events included) with their changes nested; limit and cursor count
		 * the roots. Ids come with names (`source.id` + `source.name`,
		 * `resource.id` + `resource.name`). The types of points with
		 * `isPublic = false` are left out of the answer for everyone but the
		 * admins. `from` and `to` are moments of time.
		 */
		list: (query: JournalQuery) => Promise<JournalPage>
	}
	members: {
		/** Backend: GET {party}/members */
		list: () => Promise<Member[]>
		/** Backend: GET {party}/members/{login}, the same member as in the list */
		get: (login: Login) => Promise<Member>
	}
	exchanges: {
		/** Backend: GET {party}/exchanges/catalog */
		list: () => Promise<ExchangeOffer[]>
		/**
		 * Backend: POST {party}/exchanges/catalog/{id}/use. With `targetLogins` the
		 * source side is what the named users lose and the target side is what the
		 * user making the exchange gains.
		 */
		execute: (
			id: number,
			use?: ExchangeUse,
		) => Promise<{
			resources: UserResources
			journalEntry: JournalEntry
		}>
	}
	manual: {
		/**
		 * Any user can make a manual change. An item can't be taken away (422
		 * ITEM_REMOVAL_NOT_SUPPORTED), a perk the user already holds can't be
		 * granted again (409 PERK_ALREADY_OWNED).
		 *
		 * Backend: POST {party}/grants with `targetLogins`, `entries` and
		 * `correctsEntryId`; the shared points go to
		 * PATCH {party}/points/party/types/{id}. The entry in the journal has the
		 * event kind `manual_granted`.
		 */
		apply: (request: ManualRequest) => Promise<{ journalEntry: JournalEntry }>
	}
	presence: {
		/**
		 * The app sends it about every 30 seconds while it runs; a member without
		 * a ping for 90 seconds is `offline` in the members of a party.
		 *
		 * Backend: POST /presence/ping
		 */
		ping: () => Promise<void>
	}
	parties: {
		/** Backend: GET /parties, `current` is the party chosen with `select` */
		list: () => Promise<Party[]>
		/** Backend: POST /parties, the creator joins as the first admin; 422 PARTY_DATES_INVALID */
		create: (input: PartyCreateInput) => Promise<Party>
		/** Backend: PATCH /parties/{id}, admins only; 422 PARTY_DATES_INVALID */
		update: (id: number, input: PartyInput) => Promise<void>
		/**
		 * Everything after it is in the context of this party. On the backend the
		 * party id is part of every address, so the http implementation keeps the
		 * choice on the client instead.
		 */
		select: (id: number) => Promise<void>
	}
	admin: {
		// Backend: the catalogs are the create/update/delete/restore addresses of
		// points/types, items, effects and perks (`/removed` lists the deleted).
		catalog: {
			/** GET /admin/catalog/{kind}?includeDeleted= */
			list: (
				kind: CatalogKind,
				includeDeleted: boolean,
			) => Promise<CatalogEntry[]>
			create: (
				kind: CatalogKind,
				input: CatalogEntryInput,
			) => Promise<CatalogEntry>
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
			create: (input: AdminExchangeInput) => Promise<AdminExchange>
			update: (id: number, input: AdminExchangeInput) => Promise<AdminExchange>
			remove: (id: number) => Promise<void>
			restore: (id: number) => Promise<void>
		}
		wheel: {
			groups: (kind: AdminWheelGroup['kind']) => Promise<AdminWheelGroup[]>
			createGroup: (
				kind: AdminWheelGroup['kind'],
				name: string,
			) => Promise<AdminWheelGroup>
			renameGroup: (groupId: number, name: string) => Promise<void>
			setNoRepeat: (groupId: number, noRepeat: boolean) => Promise<void>
			removeGroup: (groupId: number) => Promise<void>
			/** adds the entry, or updates it when `entryId` is given */
			saveEntry: (
				groupId: number,
				entryId: number | undefined,
				input: Pick<
					AdminWheelEntry,
					| 'name'
					| 'description'
					| 'entries'
					| 'isManualChange'
					| 'shouldApplyToAll'
				>,
			) => Promise<void>
			removeEntry: (groupId: number, entryId: number) => Promise<void>
			/**
			 * Every group of changes has a cost of its own, the games are free. An
			 * empty list makes a spin of the group free.
			 *
			 * Backend: PUT {party}/wheel/catalog/groups/{groupId}/spin-cost, the cost is
			 * read from GET {party}/wheel/catalog/groups (negative amounts there)
			 */
			spinCost: (groupId: number) => Promise<SpinCostRow[]>
			saveSpinCost: (groupId: number, rows: SpinCostRow[]) => Promise<void>
		}
		rewards: {
			get: () => Promise<Rewards>
			/** only affects the timers and games that start after it */
			save: (rewards: Rewards) => Promise<void>
		}
		parameters: {
			list: () => Promise<SystemParameter[]>
			save: (name: string, value: string) => Promise<void>
			/** the party goes back to the default value */
			reset: (name: string) => Promise<void>
		}
		members: {
			list: () => Promise<PartyMember[]>
			/** the client picks the color of the new member; 404 USER_LOGIN_NOT_FOUND, 409 MEMBER_ALREADY_EXISTS (also for a member who left) */
			add: (login: Login, color: string) => Promise<PartyMember>
			/** 409 OWN_ADMIN_RIGHTS_REVOKE when the user takes the admin rights off themselves */
			update: (
				login: Login,
				input: { displayName: string | null; isAdmin: boolean; color: string },
			) => Promise<PartyMember>
			/** when the last admin leaves, the member who joined first becomes an admin */
			remove: (login: Login) => Promise<void>
			/** brings back a member who left, 409 MEMBER_NOT_REMOVED for a current one */
			restore: (login: Login) => Promise<void>
		}
	}
}

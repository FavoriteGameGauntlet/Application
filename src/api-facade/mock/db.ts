import type {
	CompletedGame,
	Effect,
	ISODate,
	ItemStack,
	JournalEntry,
	Login,
	Perk,
	PlayerRef,
	PlayerResources,
	PlayerStatus,
	PointType,
	ResourceRef,
	Seconds,
	TimerState,
	WheelGroup,
	WheelSpinResult,
	WishlistGame,
} from '../contracts'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const ago = (ms: number): ISODate => new Date(Date.now() - ms).toISOString()
const fromNow = (ms: number): ISODate => new Date(Date.now() + ms).toISOString()

export const ME: Login = 'kirill'

export const players: PlayerRef[] = [
	'kirill',
	'anna',
	'max',
	'lena',
	'sasha',
	'oleg',
].map((login, i) => ({ login, colorIndex: i + 1 }))

export const pointTypes: PointType[] = [
	{ id: 1, name: 'Золото', unitForms: ['золото', 'золота', 'золота'] },
	{ id: 2, name: 'Репутация', unitForms: ['репутация', 'репутации', 'репутации'] },
	{ id: 3, name: 'Билеты', unitForms: ['билет', 'билета', 'билетов'] },
	{ id: 4, name: 'Осколки', unitForms: ['осколок', 'осколка', 'осколков'] },
	{ id: 5, name: 'Опыт', unitForms: ['опыт', 'опыта', 'опыта'] },
	{ id: 6, name: 'Карма', unitForms: ['карма', 'кармы', 'кармы'] },
]

type ItemDef = { id: number; description: string; usesMax: number }

export const itemCatalog: Record<string, ItemDef> = {
	Колобок: {
		id: 1,
		description: 'монетка: +3 очка или Колобок укатывается к другому игроку',
		usesMax: 1,
	},
	'Свиток удачи': { id: 2, description: '+50 золота', usesMax: 1 },
	'Билет на колесо': { id: 3, description: '+1 прокрут колеса', usesMax: 1 },
	Щит: { id: 4, description: 'эффект «Щит» на 1 день', usesMax: 3 },
	Проклятие: { id: 5, description: '−30 золота', usesMax: 2 },
	'Кубик реролла': { id: 6, description: '+1 перекрут колеса', usesMax: 1 },
	'Свиток пропуска': {
		id: 7,
		description: 'снимает текущую игру без штрафа',
		usesMax: 1,
	},
}

export const perkCatalog: Record<string, Omit<Perk, 'name'>> = {
	Везунчик: {
		id: 1,
		effect: {
			name: 'Бесплатный перекрут',
			text: '+1 перекрут колеса.',
		},
		kind: 'active',
		usesLeft: 1,
		usesMax: 1,
	},
	Марафонец: {
		id: 2,
		effect: {
			name: 'Второе дыхание',
			text: '+10% золота за таймер дольше 3 ч, а за таймер дольше 5 ч ещё +1 билет на колесо.',
		},
		kind: 'passive',
	},
	Коллекционер: {
		id: 3,
		effect: {
			name: 'Трофей',
			text: '+1 случайный предмет за каждую пройденную игру.',
		},
		kind: 'passive',
	},
}

export const makeItem = (
	name: string,
	held: number,
	usesLeft?: number,
): ItemStack => {
	const def = itemCatalog[name]

	return {
		id: def.id,
		name,
		description: def.description,
		held,
		usesLeft: usesLeft ?? def.usesMax,
		usesMax: def.usesMax,
	}
}

export const makePerk = (name: string, usesLeft?: number): Perk => {
	const def = perkCatalog[name]

	return {
		name,
		...def,
		...(def.kind === 'active' && { usesLeft: usesLeft ?? def.usesMax }),
	}
}

const effectIds: Record<string, number> = {}

const effectId = (name: string) =>
	(effectIds[name] ??= Object.keys(effectIds).length + 1)

export const pointRef = (name: string, amount: number): ResourceRef => ({
	kind: 'points',
	id: pointTypes.find((t) => t.name === name)!.id,
	name,
	amount,
})

export const itemRef = (name: string, amount: number): ResourceRef => ({
	kind: 'item',
	id: itemCatalog[name].id,
	name,
	amount,
})

export const perkRef = (name: string): ResourceRef => ({
	kind: 'perk',
	id: perkCatalog[name].id,
	name,
})

export const effectRef = (name: string): ResourceRef => ({
	kind: 'effect',
	id: effectId(name),
	name,
})

const ref = (login: Login) => players.find((p) => p.login === login)!

const points = (
	gold: number,
	rep: number,
	tickets: number,
	shards: number,
	xp: number,
	karma: number,
): Record<number, number> => ({ 1: gold, 2: rep, 3: tickets, 4: shards, 5: xp, 6: karma })

const effect = (
	name: string,
	description: string,
	source: string,
	expiresIn: number | null,
	uses?: [left: number, max: number],
): Effect => ({
	id: effectId(name),
	name,
	description,
	source,
	expiresAt: expiresIn === null ? null : fromNow(expiresIn),
	...(uses && { usesLeft: uses[0], usesMax: uses[1] }),
})

export const resources: Record<Login, PlayerResources> = {
	kirill: {
		player: ref('kirill'),
		points: points(340, 12, 3, 27, 1180, -4),
		items: [
			makeItem('Свиток удачи', 6),
			makeItem('Билет на колесо', 11),
			makeItem('Щит', 3, 2),
			makeItem('Проклятие', 2, 1),
		],
		perks: [makePerk('Везунчик'), makePerk('Марафонец')],
		effects: [
			effect(
				'×2 золото',
				'Двойное золото за таймер.',
				'предмет «Свиток удачи» · ты',
				HOUR + 40 * MIN,
			),
			effect(
				'Щит',
				'Блокирует негативные предметы.',
				'предмет «Щит» · ты',
				22 * HOUR,
				[1, 2],
			),
			effect(
				'Проклятие',
				'−10% золота за таймер.',
				'предмет «Проклятие» · от anna',
				3 * HOUR,
			),
			effect(
				'Знак дуэлянта',
				'+1 к броску в «Кубической дуэли».',
				'колесо · Бонусы',
				null,
			),
			effect(
				'Заморозка',
				'Ставит таймер на паузу без потери прогресса.',
				'предмет «Зелье времени» · ты',
				null,
				[2, 3],
			),
		],
	},
	anna: {
		player: ref('anna'),
		points: points(520, 18, 5, 41, 1640, 6),
		items: [
			makeItem('Колобок', 1),
			makeItem('Свиток удачи', 4),
			makeItem('Щит', 2, 2),
			makeItem('Кубик реролла', 1),
		],
		perks: [makePerk('Везунчик', 0)],
		effects: [
			effect(
				'×2 золото',
				'Двойное золото за таймер.',
				'колесо · anna',
				4 * HOUR,
			),
		],
	},
	max: {
		player: ref('max'),
		points: points(290, 9, 2, 12, 990, 0),
		items: [
			makeItem('Билет на колесо', 4),
			makeItem('Щит', 1),
			makeItem('Кубик реролла', 2),
		],
		perks: [makePerk('Марафонец')],
		effects: [
			effect(
				'×2 золото',
				'Двойное золото за таймер.',
				'колесо · max',
				2 * HOUR,
			),
		],
	},
	lena: {
		player: ref('lena'),
		points: points(210, 15, 4, 30, 870, 3),
		items: [makeItem('Свиток удачи', 2), makeItem('Свиток пропуска', 1)],
		perks: [],
		effects: [
			effect(
				'Проклятие',
				'−10% золота за таймер.',
				'предмет «Проклятие» · от anna',
				26 * HOUR,
			),
		],
	},
	sasha: {
		player: ref('sasha'),
		points: points(180, 7, 1, 8, 610, -2),
		items: [makeItem('Колобок', 1), makeItem('Билет на колесо', 2)],
		perks: [],
		effects: [
			effect(
				'−10% очков',
				'Все начисления очков на 10% меньше.',
				'колесо · sasha',
				6 * HOUR,
			),
		],
	},
	oleg: {
		player: ref('oleg'),
		points: points(95, 4, 0, 3, 240, 1),
		items: [makeItem('Билет на колесо', 1)],
		perks: [],
		effects: [],
	},
}

const wish = (id: number, name: string, addedAt: ISODate): WishlistGame => ({
	id,
	name,
	addedAt,
})

export const wishlists: Record<Login, WishlistGame[]> = {
	kirill: [
		wish(1, 'Celeste', '2026-09-05T12:00:00Z'),
		wish(2, 'Hades', '2026-09-11T12:00:00Z'),
		wish(3, 'Outer Wilds', '2026-09-20T12:00:00Z'),
		wish(4, 'Inside', '2026-10-01T12:00:00Z'),
		wish(5, 'Stardew Valley', '2026-10-04T12:00:00Z'),
	],
	anna: [
		wish(6, 'Celeste', '2026-09-01T12:00:00Z'),
		wish(7, 'Hollow Knight: Silksong', '2026-09-03T12:00:00Z'),
		wish(8, 'Ori and the Will of the Wisps', '2026-09-12T12:00:00Z'),
		wish(9, 'Tunic', '2026-09-30T12:00:00Z'),
	],
	max: [
		wish(10, 'Signalis', '2026-09-15T12:00:00Z'),
		wish(11, 'Hades II', '2026-09-22T12:00:00Z'),
	],
	lena: [
		wish(12, 'Pentiment', '2026-09-02T12:00:00Z'),
		wish(13, 'Outer Wilds', '2026-09-19T12:00:00Z'),
		wish(14, 'Return of the Obra Dinn', '2026-10-05T12:00:00Z'),
	],
	sasha: [],
	oleg: [],
}

const done = (
	id: number,
	name: string,
	startedAt: string,
	endedAt: string,
	hours: number,
	minutes: number,
	status: CompletedGame['status'],
	rating: number | null = null,
	review: string | null = null,
): CompletedGame => ({
	id,
	name,
	startedAt: `${startedAt}T12:00:00Z`,
	endedAt: `${endedAt}T12:00:00Z`,
	playedSeconds: hours * 3600 + minutes * 60,
	status,
	rating,
	review,
})

export const completed: Record<Login, CompletedGame[]> = {
	kirill: [
		done(
			1,
			'Disco Elysium',
			'2026-09-12',
			'2026-10-07',
			31,
			20,
			'completed',
			9,
			'Лучшие диалоги, что я читал в играх. Провалил половину проверок и ни о чём не жалею.',
		),
		done(2, 'Inside', '2026-09-24', '2026-09-28', 4, 5, 'completed'),
		done(3, 'Dead Cells', '2026-09-15', '2026-09-19', 6, 40, 'cancelled'),
		done(4, 'Control', '2026-09-09', '2026-09-10', 1, 15, 'rerolled'),
		done(
			5,
			'Portal 2',
			'2026-08-25',
			'2026-09-02',
			9,
			50,
			'completed',
			8,
			'Кооп с Аней — отдельное удовольствие. Финал до сих пор вспоминаю.',
		),
	],
	anna: [
		done(
			6,
			'Celeste',
			'2026-09-20',
			'2026-10-06',
			14,
			30,
			'completed',
			10,
			'Сложно, честно и очень тепло. Б-стороны добила на одном упрямстве.',
		),
		done(
			7,
			'Hades',
			'2026-09-01',
			'2026-09-18',
			27,
			10,
			'completed',
			8,
			'Затягивает с первого забега. Под конец гринд немного утомил.',
		),
		done(8, 'Cuphead', '2026-08-28', '2026-08-31', 3, 20, 'cancelled'),
		done(
			9,
			'Firewatch',
			'2026-08-20',
			'2026-08-23',
			4,
			45,
			'completed',
			7,
			'Красиво и атмосферно, но концовка оборвалась.',
		),
	],
	max: [
		done(
			10,
			'Undertale',
			'2026-09-10',
			'2026-09-18',
			7,
			15,
			'completed',
			9,
			'Пацифист с первого раза. Музыка — отдельная любовь.',
		),
	],
	lena: [
		done(11, 'Inscryption', '2026-09-14', '2026-09-29', 12, 40, 'completed'),
		done(12, 'Control', '2026-09-05', '2026-09-08', 2, 10, 'rerolled'),
	],
	sasha: [],
	oleg: [],
}

const entry = (
	id: number,
	at: ISODate,
	actor: JournalEntry['actor'],
	kind: JournalEntry['source']['kind'],
	label: string,
	manual: boolean,
	changes: JournalEntry['changes'],
): JournalEntry => ({
	id,
	at,
	actor,
	source: { kind, label },
	manual,
	changes,
})

export const journal: JournalEntry[] = [
	entry(1, ago(12 * MIN), 'anna', 'item', 'предмет «Колобок»', true, [
		{
			player: 'anna',
			text: '−1 Колобок',
			resource: itemRef('Колобок', -1),
		},
		{
			player: 'sasha',
			text: '+1 Колобок',
			resource: itemRef('Колобок', 1),
		},
	]),
	entry(
		2,
		ago(30 * MIN),
		'kirill',
		'item',
		'предмет «Кубическая дуэль»',
		true,
		[
			{ player: 'kirill', text: '+3 очка' },
			{ player: 'kirill', text: '+1 Реролл игры' },
		],
	),
	entry(
		3,
		ago(2 * HOUR),
		'kirill',
		'exchange',
		'обмен «Набор для рерола»',
		false,
		[
			{
				player: 'kirill',
				text: '−80 золота',
				resource: pointRef('Золото', -80),
			},
			{
				player: 'kirill',
				text: '−2 репутации',
				resource: pointRef('Репутация', -2),
			},
			{
				player: 'kirill',
				text: '+1 Свиток пропуска',
				resource: itemRef('Свиток пропуска', 1),
			},
		],
	),
	entry(4, ago(3 * HOUR), 'anna', 'item', 'предмет «Проклятие»', false, [
		{
			player: 'kirill',
			text: 'эффект Проклятие · 3 ч',
			resource: effectRef('Проклятие'),
		},
	]),
	entry(5, ago(5 * HOUR), 'max', 'wheel', 'колесо · «×2 золото»', false, [
		{
			player: 'max',
			text: 'эффект ×2 золото · 2 ч',
			resource: effectRef('×2 золото'),
		},
	]),
	entry(
		6,
		ago(DAY + 2 * HOUR),
		'lena',
		'timer',
		'таймер · Disco Elysium',
		false,
		[
			{
				player: 'lena',
				text: '+50 золота',
				resource: pointRef('Золото', 50),
			},
		],
	),
	entry(7, ago(DAY + 6 * HOUR), 'admin', 'grant', 'грант', false, [
		{
			player: 'all',
			text: '+100 золота',
			resource: pointRef('Золото', 100),
		},
	]),
]

/** extra history of resource changes that are older than the journal, `login|kind|id` */
export const resourceHistory: Record<
	string,
	{ at: ISODate; source: string; delta: string }[]
> = {
	[`kirill|item|${itemCatalog['Щит'].id}`]: [
		{ at: ago(6 * DAY), source: 'колесо', delta: '+1' },
		{ at: ago(9 * DAY), source: 'грант админа', delta: '+3' },
	],
	[`kirill|item|${itemCatalog['Свиток удачи'].id}`]: [
		{ at: ago(DAY), source: 'таймер', delta: '+1' },
		{ at: ago(8 * DAY), source: 'колесо', delta: '+2' },
	],
	[`anna|item|${itemCatalog['Щит'].id}`]: [
		{ at: ago(7 * DAY), source: 'обмен «Разобрать щиты»', delta: '−2' },
	],
}

/**
 * Automatic entries are applied by the wheel itself, `isManualChange` entries
 * need the manual change form (effects, swaps, anything with a choice).
 */
export const wheelGroups: WheelGroup[] = [
	{
		id: 1,
		name: 'Бонусы',
		kind: 'changes',
		entries: [
			{
				id: 11,
				name: '+50 золота',
				description: 'Начисляется 50 золота.',
				entries: [pointRef('Золото', 50)],
			},
			{
				id: 12,
				name: '×2 золото',
				description: 'Два часа таймер даёт двойное золото.',
				isManualChange: true,
			},
			{ id: 13, name: 'Бесплатный перекрут', isManualChange: true },
			{ id: 14, name: '+1 билет', entries: [pointRef('Билеты', 1)] },
			{
				id: 15,
				name: 'Щит на день',
				description: 'Сутки на тебя не действуют проклятия.',
				isManualChange: true,
			},
			{ id: 16, name: '+5 репутации', entries: [pointRef('Репутация', 5)] },
		],
	},
	{
		id: 2,
		name: 'Штрафы',
		kind: 'changes',
		entries: [
			{
				id: 21,
				name: 'Пропуск таймера',
				description: 'Следующий таймер без награды.',
				isManualChange: true,
			},
			{
				id: 22,
				name: 'Проклятие на день',
				description: 'Сутки все награды на 25% меньше.',
				isManualChange: true,
			},
			{
				id: 23,
				name: '−1 билет',
				description: 'Списывается один билет на колесо.',
				entries: [pointRef('Билеты', -1)],
			},
			{
				id: 24,
				name: '−20 золота',
				description: 'Списывается 20 золота.',
				entries: [pointRef('Золото', -20)],
			},
			{ id: 25, name: '−50% награды таймера', isManualChange: true },
			{ id: 26, name: 'Минус предмет', isManualChange: true },
			{ id: 27, name: 'Отдать 30 золота лидеру', isManualChange: true },
		],
	},
	{
		id: 3,
		name: 'Предметы',
		kind: 'changes',
		entries: [
			{ id: 31, name: 'Свиток удачи', entries: [itemRef('Свиток удачи', 1)] },
			{ id: 32, name: 'Щит', entries: [itemRef('Щит', 1)] },
			{ id: 33, name: 'Колобок', entries: [itemRef('Колобок', 1)] },
			{ id: 34, name: 'Кубическая дуэль', isManualChange: true },
			{
				id: 35,
				name: 'Свиток пропуска',
				entries: [itemRef('Свиток пропуска', 1)],
			},
		],
	},
	{
		id: 4,
		name: 'Перки',
		kind: 'changes',
		entries: [
			{ id: 41, name: 'Везунчик', entries: [perkRef('Везунчик')] },
			{ id: 42, name: 'Марафонец', entries: [perkRef('Марафонец')] },
			{ id: 43, name: 'Коллекционер', entries: [perkRef('Коллекционер')] },
			{ id: 44, name: 'Щедрый', isManualChange: true },
		],
	},
	{
		id: 5,
		name: 'Хаос',
		kind: 'changes',
		entries: [
			{ id: 51, name: 'Обмен вишлистами', isManualChange: true },
			{ id: 52, name: 'Все меняются местами', isManualChange: true },
			{
				id: 53,
				name: 'Случайный игрок получает 50 золота',
				isManualChange: true,
			},
			{ id: 54, name: 'Таймер ×2 на час', isManualChange: true },
			{ id: 55, name: 'Отдать предмет соседу', isManualChange: true },
		],
	},
]

export type ExchangeDef = {
	id: number
	name: string
	description: string
	give: ResourceRef[]
	get: ResourceRef[]
}

export const exchangeDefs: ExchangeDef[] = [
	{
		id: 1,
		name: 'Набор для рерола',
		description:
			'Пригодится, если колесо выдало неудачную игру. Свиток снимает текущую игру без штрафа, кубик даёт перекрут.',
		give: [pointRef('Золото', 80), pointRef('Репутация', 2)],
		get: [itemRef('Свиток пропуска', 1), itemRef('Кубик реролла', 1)],
	},
	{
		id: 2,
		name: 'Перк «Коллекционер»',
		description:
			'Постоянный перк: +1 случайный предмет за каждую пройденную игру. Покупается один раз за сезон.',
		give: [
			pointRef('Билеты', 3),
			itemRef('Свиток удачи', 1),
			pointRef('Осколки', 40),
		],
		get: [perkRef('Коллекционер')],
	},
	{
		id: 3,
		name: 'Разобрать щиты',
		description: 'Лишние щиты можно превратить в золото и осколки.',
		give: [itemRef('Щит', 2)],
		get: [
			pointRef('Золото', 60),
			pointRef('Осколки', 10),
			pointRef('Билеты', 1),
		],
	},
]

export type MemberSeed = {
	status: PlayerStatus
	currentGame: string | null
	playedHours: number
	completedCount: number
	spinsCount: number
}

export const memberSeeds: Record<Login, MemberSeed> = {
	anna: {
		status: 'playing',
		currentGame: 'Celeste',
		playedHours: 214,
		completedCount: 23,
		spinsCount: 31,
	},
	max: {
		status: 'paused',
		currentGame: 'Hades',
		playedHours: 131,
		completedCount: 14,
		spinsCount: 19,
	},
	lena: {
		status: 'offline',
		currentGame: 'Disco Elysium',
		playedHours: 97,
		completedCount: 9,
		spinsCount: 15,
	},
	oleg: {
		status: 'offline',
		currentGame: null,
		playedHours: 42,
		completedCount: 4,
		spinsCount: 8,
	},
	sasha: {
		status: 'playing',
		currentGame: 'Outer Wilds',
		playedHours: 76,
		completedCount: 8,
		spinsCount: 11,
	},
}

export const MY_PLAYED_HOURS = 168
export const MY_COMPLETED_BEFORE_SEASON = 14
export const MY_SPINS = 22

export const TIMER_GOAL: Seconds = 7200

export const state = {
	currentGame: {
		game: { id: 1, name: 'Heroes of Might and Magic: Olden Era' } as {
			id: number
			name: string
		} | null,
		playedSeconds: 6 * 3600,
		startedAt: ago(3 * DAY),
	},
	timer: {
		state: 'running' as TimerState,
		elapsed: 5077 as Seconds,
		stampedAt: Date.now(),
	},
	/** the spin that waits to be applied; a new spin replaces it */
	spin: null as WheelSpinResult | null,
}

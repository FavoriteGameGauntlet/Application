/**
 * The colors a member can get. The backend keeps whatever lowercase hex the
 * client sends, so this list is the only place that says which ones the app
 * offers; an admin may also type any other value.
 */
export const MEMBER_COLORS = [
	'#ffb000',
	'#3d7bff',
	'#e5484d',
	'#22b07d',
	'#a35cff',
	'#ff7a2f',
	'#1fc2d6',
	'#ff5cae',
	'#a3d921',
	'#c9adff',
	'#c98a63',
	'#b3b64a',
] as const

/** what a screen reader says for a palette circle instead of its hex */
export const MEMBER_COLOR_NAMES: Record<
	(typeof MEMBER_COLORS)[number],
	string
> = {
	'#ffb000': 'Жёлтый',
	'#3d7bff': 'Синий',
	'#e5484d': 'Красный',
	'#22b07d': 'Зелёный',
	'#a35cff': 'Фиолетовый',
	'#ff7a2f': 'Оранжевый',
	'#1fc2d6': 'Бирюзовый',
	'#ff5cae': 'Розовый',
	'#a3d921': 'Салатовый',
	'#c9adff': 'Лавандовый',
	'#c98a63': 'Коричневый',
	'#b3b64a': 'Оливковый',
}

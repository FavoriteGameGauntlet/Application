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

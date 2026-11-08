import { load, type Store } from '@tauri-apps/plugin-store'

export enum StoreKey {
	InitialRoute = 'initialRoute',
	Login = 'login',
	DisplayName = 'displayName',
	PartyId = 'partyId',
	Theme = 'theme',
	Scale = 'scale',
	MiniWidth = 'miniWidth',
	SidebarCollapsed = 'sidebarCollapsed',
}

export type StoredData = Partial<{
	[StoreKey.InitialRoute]: string
	[StoreKey.Login]: string
	[StoreKey.DisplayName]: string
	/** the party the user works in; every backend address except /auth/* and /parties lives under it */
	[StoreKey.PartyId]: number
	[StoreKey.Theme]: string
	/** interface scale in percent */
	[StoreKey.Scale]: number
	/** width of the mini window in px at the interface scale of 100%, the height follows the ratio */
	[StoreKey.MiniWidth]: number
	[StoreKey.SidebarCollapsed]: boolean
}>

const defaults: StoredData = {
	[StoreKey.InitialRoute]: undefined,
	[StoreKey.Login]: undefined,
	[StoreKey.DisplayName]: undefined,
	[StoreKey.PartyId]: undefined,
	[StoreKey.Theme]: undefined,
	[StoreKey.Scale]: undefined,
	[StoreKey.MiniWidth]: undefined,
	[StoreKey.SidebarCollapsed]: undefined,
} as const

let store: Store | null = null
const storeLoader = load('store.json', { autoSave: true, defaults })

const getStore = async () => {
	store ??= await storeLoader
	return store
}

export const persistentStorage = {
	async get<K extends keyof StoredData = keyof StoredData>(
		key: K,
	): Promise<StoredData[K]> {
		const s = await getStore()
		return s.get<StoredData[K]>(key)
	},

	async delete<K extends keyof StoredData>(key: K) {
		const s = await getStore()
		return s.delete(key)
	},

	async set<K extends keyof StoredData>(
		key: K,
		value: StoredData[K],
	): Promise<void> {
		const s = await getStore()
		return s.set(key, value)
	},

	async has<K extends keyof StoredData>(key: K): Promise<boolean> {
		const s = await getStore()
		return s.has(key)
	},

	// async getAll(): Promise<StoredData> {
	// 	const s = await getStore()
	// 	return (await s.entries<StoredData[keyof StoredData]>()).reduce<StoredData>(
	// 		(acc, [k, v]) => {
	// 			acc[k as keyof StoredData] = v
	// 			return acc
	// 		},
	// 		{},
	// 	)
	// },

	async clear(): Promise<void> {
		return await (await getStore()).clear()
	},
}

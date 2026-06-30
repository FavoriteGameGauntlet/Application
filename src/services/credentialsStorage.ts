import type { Client} from '@tauri-apps/plugin-stronghold';
import { Stronghold } from '@tauri-apps/plugin-stronghold'
import { appLocalDataDir } from '@tauri-apps/api/path'

const VAULT_PASSWORD = 'fgg-credentials-vault-v1'
const CLIENT_NAME = 'fgg'
const USERNAME_KEY = 'username'
const PASSWORD_KEY = 'password'

let _stronghold: Stronghold | null = null
let _client: Client | null = null

const encode = (text: string) => Array.from(new TextEncoder().encode(text))
const decode = (data: Uint8Array) => new TextDecoder().decode(data)

const getClient = async () => {
	if (_client) return _client

	const vaultPath = `${await appLocalDataDir()}/credentials.hold`
	_stronghold = await Stronghold.load(vaultPath, VAULT_PASSWORD)

	try {
		_client = await _stronghold.loadClient(CLIENT_NAME)
	} catch {
		_client = await _stronghold.createClient(CLIENT_NAME)
	}

	return _client
}

export const credentialsStorage = {
	async save(username: string, password: string): Promise<void> {
		const client = await getClient()
		const store = client.getStore()
		await store.insert(USERNAME_KEY, encode(username))
		await store.insert(PASSWORD_KEY, encode(password))
		await _stronghold!.save()
	},

	async get(): Promise<{ username: string; password: string } | null> {
		try {
			const client = await getClient()
			const store = client.getStore()
			const username = await store.get(USERNAME_KEY)
			const password = await store.get(PASSWORD_KEY)
			if (!username || !password) return null
			return { username: decode(username), password: decode(password) }
		} catch {
			return null
		}
	},

	async clear(): Promise<void> {
		try {
			const client = await getClient()
			const store = client.getStore()
			await store.remove(USERNAME_KEY)
			await store.remove(PASSWORD_KEY)
			await _stronghold!.save()
		} catch {
			// ignore if vault doesn't exist yet
		}
	},
}

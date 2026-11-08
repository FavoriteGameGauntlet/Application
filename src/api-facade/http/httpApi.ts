import type { Api } from '../contracts'
import { adminCatalog } from './adminCatalog'
import { adminParameters } from './adminParameters'
import { adminRewards } from './adminRewards'
import { adminWheel } from './adminWheel'
import { auth } from './auth'
import { adminExchanges, exchanges } from './exchanges'
import { completed, currentGame, wishlist } from './games'
import { journal } from './journal'
import { manual } from './manual'
import { members } from './members'
import { adminMembers, parties, session } from './parties'
import { presence } from './presence'
import { resources } from './resources'
import { timer } from './timers'
import { wheel } from './wheel'

export const httpApi: Api = {
	auth,
	session,
	currentGame,
	timer,
	wheel,
	wishlist,
	completed,
	resources,
	journal,
	members,
	exchanges,
	manual,
	presence,
	parties,
	admin: {
		catalog: adminCatalog,
		exchanges: adminExchanges,
		rewards: adminRewards,
		wheel: adminWheel,
		members: adminMembers,
		parameters: adminParameters,
	},
}

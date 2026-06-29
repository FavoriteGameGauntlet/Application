/**
 * @version 0.12.5
 * Last updated: 2026.05.13
 * State: only Points group is incomplete. Probably requires a rewrite.
 */
import { apiAuth } from './api/apiAuth'
import { apiGames } from './api/apiGames'
// import { apiPoints } from './api/apiPoints'
import { apiSystemParameters } from './api/apiSystemParameters'
import { apiTimers } from './api/apiTimers'
import { apiUsers } from './api/apiUsers'
import { apiWheelEffects } from './api/apiWheelEffects'

export const api = {
	auth: apiAuth,
	games: apiGames,
	// points: apiPoints,
	systemParameters: apiSystemParameters,
	timers: apiTimers,
	users: apiUsers,
	wheelEffects: apiWheelEffects,
}

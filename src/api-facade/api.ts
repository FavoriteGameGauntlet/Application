import { apiAuth } from './api/apiAuth'
import { apiGames } from './api/apiGames'
import { apiPoints } from './api/apiPoints'
import { apiSystemParameters } from './api/apiSystemParameters'
import { apiTimers } from './api/apiTimers'
import { apiUsers } from './api/apiUsers'
import { apiWheelEffects } from './api/apiWheelEffects'

export const api = {
	auth: apiAuth,
	games: apiGames,
	points: apiPoints,
	systemParameters: apiSystemParameters,
	timers: apiTimers,
	users: apiUsers,
	wheelEffects: apiWheelEffects,
}

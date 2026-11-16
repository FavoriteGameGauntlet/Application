import { createMemoryHistory, createRouter } from 'vue-router'
import { authGuard } from './authGuard'
import { partyGuard } from './partyGuard'
import { routes } from './routes'

export const router = createRouter({
	history: createMemoryHistory(),
	routes,
})

router.beforeEach(authGuard)
router.beforeEach(partyGuard)

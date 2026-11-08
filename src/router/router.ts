import { createMemoryHistory, createRouter } from 'vue-router'
import { authGuard } from './authGuard'
import { initialPathGuard } from './initialPathGuard'
import { routes } from './routes'

export const router = createRouter({
	history: createMemoryHistory(),
	routes,
})

router.beforeEach(initialPathGuard)
router.beforeEach(authGuard)

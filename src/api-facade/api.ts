import type { Api } from './contracts'
import { httpApi } from './http/httpApi'
import { mockApi } from './mock/mockApi'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

export const api: Api = USE_MOCKS ? mockApi : httpApi

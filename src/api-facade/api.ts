import type { Api } from './contracts'
import { httpApi } from './http/httpApi'

export const api: Api = httpApi

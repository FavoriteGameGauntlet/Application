import { computed, ref, watch } from 'vue'

import type { ComputedRef, Ref } from 'vue'

export const enum LoadingStatus {
	INIT,
	LOADING,
	LOADED,
	ERROR,
}

export type LoadingState = {
	status: Readonly<Ref<LoadingStatus>>

	isInit: ComputedRef<boolean>
	isLoading: ComputedRef<boolean>
	isLoaded: ComputedRef<boolean>
	isError: ComputedRef<boolean>

	on: (target: LoadingStatus[]) => Promise<void>
}

export const makeLoadingState = () => {
	const status = ref<LoadingStatus>(LoadingStatus.INIT)

	return {
		status,

		isInit: computed(() => status.value === LoadingStatus.INIT),
		isLoading: computed(() => status.value === LoadingStatus.LOADING),
		isLoaded: computed(() => status.value === LoadingStatus.LOADED),
		isError: computed(() => status.value === LoadingStatus.ERROR),

		on: async (target): Promise<void> => {
			if (target.includes(status.value)) return

			return new Promise<void>((resolve) => {
				const stop = watch(status, (update) => {
					if (!target.includes(update)) return
					stop()
					resolve()
				})
			})
		},
	} satisfies LoadingState
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withLoading = <TArgs extends any[], TReturn>(
	fn: (status: Ref<LoadingStatus>, ...args: TArgs) => TReturn,
): [(...args: TArgs) => TReturn, LoadingState] => {
	const state = makeLoadingState()

	const callable = (...args: TArgs): TReturn => fn(state.status, ...args)

	return [callable, state]
}

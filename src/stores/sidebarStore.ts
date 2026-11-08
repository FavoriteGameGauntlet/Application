import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePersistentRef } from '../composables/usePersistentRef'
import { StoreName } from '../enums/storeName'
import { StoreKey } from '../services/persistentStorage'

export const useSidebarStore = defineStore(StoreName.Sidebar, () => {
	const { state: collapsed } = usePersistentRef(StoreKey.SidebarCollapsed)

	const isCollapsed = computed(() => collapsed.value === true)

	const toggle = () => {
		collapsed.value = !isCollapsed.value
	}

	return { isCollapsed, toggle }
})

import { type NavigationGuard } from 'vue-router'
import { usePartiesStore } from '../stores/partiesStore'
import { RouteName } from './routeNames'

/** every screen but the login and the party list reads the data of the chosen party */
export const partyGuard: NavigationGuard = async (to) => {
	if (to.name === RouteName.Login || to.name === RouteName.Parties) return true

	return (await usePartiesStore().isSelected()) || { name: RouteName.Parties }
}

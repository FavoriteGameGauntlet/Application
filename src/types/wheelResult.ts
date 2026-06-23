import type { RolledWheelEffectDto } from '../api-facade/models/wheel-effects-models'

type Tuple<
	Item,
	Count extends number,
	Acc extends Item[] = [],
> = Acc['length'] extends Count ? Acc : Tuple<Item, Count, [...Acc, Item]>

export type WheelResult = Tuple<RolledWheelEffectDto, 5>

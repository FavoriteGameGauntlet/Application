<template>
	<div class="ui-view">
		<div class="ui-view__column" v-bind="$attrs">
			<slot />
		</div>
	</div>
</template>

<style scoped>
.ui-view {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;

	overflow: auto;

	max-block-size: 100%;
	min-block-size: 100%;
	block-size: 100%;
}

.ui-view__column {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-inline: auto;

	max-inline-size: 700px;
	min-inline-size: 320px;
	inline-size: 100%;

	padding-block: 2rem;
}
</style>

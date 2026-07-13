<script setup lang="ts">
import { computed } from 'vue'
import UiTimestamp from '../../../components/ui/UiTimestamp.vue'
import { useFeatureUserStore } from '../../../stores/feature/featureUserStore'

type Props = {
	login: string
	displayName?: string
}

const { login, displayName } = defineProps<Props>()

const userStore = useFeatureUserStore()

const currentGame = computed(() => userStore.userCurrentGame[login])
const territoryPoints = computed(() => userStore.userPoints[login]?.territoryPoints)
const freePoints = computed(() => userStore.userPoints[login]?.freePoints)
</script>

<template>
	<div class="avatar"></div>

	<div class="user-card">
		<div class="user-card__row">
			<div class="cell cell--name">
				<span class="user-login">{{ login }}</span>
				<span class="user-meta">{{ displayName }}</span>
			</div>

			<div class="cell cell--points">
				<div class="user-points__item">
					<svg
						class="points-icon"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M2 14V6.5L8 2l6 4.5V14"
							stroke="currentColor"
							stroke-width="1.3"
							stroke-linejoin="round"
						/>
						<path d="M2 9.5h12" stroke="currentColor" stroke-width="1.3" />
					</svg>
					<span class="metric-value">{{ territoryPoints ?? '…' }}</span>
				</div>
				<div class="user-points__item">
					<svg
						class="points-icon"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M8 1.5l1.85 3.9 4.15.6-3 3 .7 4.1L8 11.1 4.3 13.1l.7-4.1-3-3 4.15-.6L8 1.5z"
							stroke="currentColor"
							stroke-width="1.1"
							stroke-linejoin="round"
						/>
					</svg>
					<span class="metric-value">{{ freePoints ?? '…' }}</span>
				</div>
			</div>
		</div>

		<div class="user-card__row" v-if="currentGame">
			<div class="cell">
				<span class="current-game-name">{{ currentGame.name }}</span>
			</div>

			<div class="cell cell--time">
				<UiTimestamp :time="currentGame.timeSpent" />
			</div>
		</div>
	</div>
</template>

<style scoped>
.avatar {
	width: 38px;
	height: 38px;
	border-radius: 50%;
	background-color: var(--color-border);
	flex-shrink: 0;
}

.user-card {
	display: flex;
	flex-direction: column;
	flex: 1;
}

.user-card__row {
	display: flex;
	align-items: flex-start;
}

.cell {
	flex: 1;
	display: flex;
	align-items: flex-start;
	padding: 8px 14px;
}

.cell--points {
	justify-content: flex-end;
	gap: 16px;
}

.cell--time {
	justify-content: flex-end;
}

.cell--name {
	flex-direction: column;
	gap: 2px;
}

.user-login {
	font-weight: 600;
}

.user-meta {
	font-size: 0.8125rem;
	color: var(--color-muted);
}

.user-points__item {
	display: flex;
	align-items: center;
	gap: 6px;
}

.points-icon {
	width: 14px;
	height: 14px;
	color: var(--color-faint);
	flex-shrink: 0;
}

.metric-value {
	font-size: 1rem;
	font-weight: 600;
	min-width: 4ch;
	text-align: left;
	font-variant-numeric: tabular-nums;
}

.current-game-name {
	font-size: 0.8125rem;
	color: var(--color-muted);
}
</style>

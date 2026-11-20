<script setup lang="ts">
import { SCALES, useScaleStore } from '../stores/scaleStore'
import { Theme, useThemeStore } from '../stores/themeStore'
import { TimerSoundStop, useTimerSoundStore } from '../stores/timerSoundStore'
import UiButton from './ui/UiButton.vue'
import UiDialog from './ui/UiDialog.vue'
import UiFormSection from './ui/UiFormSection.vue'
import UiIcon from './ui/UiIcon.vue'
import UiSegmented from './ui/UiSegmented.vue'
import UiSelect from './ui/UiSelect.vue'
import UiSwitch from './ui/UiSwitch.vue'

defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: [] }>()

const scaleStore = useScaleStore()
const themeStore = useThemeStore()
const sound = useTimerSoundStore()

const themeOptions = [
	{ value: Theme.Light, label: 'Светлая' },
	{ value: Theme.Dark, label: 'Тёмная' },
]

const stopOptions = [
	{ value: TimerSoundStop.Focus, label: 'При возврате в FGG' },
	{ value: TimerSoundStop.Button, label: 'Кнопкой в таймере' },
]

const scaleOptions = SCALES.map((s) => ({ value: String(s), label: `${s}%` }))

const onClose = () => {
	// a sound left playing has nobody to stop it once the window is gone
	sound.stop()
	emit('close')
}
</script>

<template>
	<UiDialog :open title="Настройки пользователя" :width="520" @close="onClose">
		<div class="settings">
			<UiFormSection title="Интерфейс">
				<div class="settings__row">
					Тема
					<UiSegmented
						label="Тема"
						:options="themeOptions"
						:model-value="themeStore.isDark ? Theme.Dark : Theme.Light"
						@update:model-value="themeStore.set($event as Theme)"
					/>
				</div>

				<div class="settings__row">
					Масштаб интерфейса
					<div class="settings__control">
						<UiSelect
							compact
							aria-label="Масштаб интерфейса"
							:options="scaleOptions"
							:model-value="String(scaleStore.scale)"
							@update:model-value="scaleStore.set(Number($event))"
						/>
					</div>
				</div>
			</UiFormSection>

			<span class="settings__divider"></span>

			<UiFormSection title="Звук таймера">
				<div class="settings__row">
					Звук по окончании таймера
					<UiSwitch
						aria-label="Звук по окончании таймера"
						:model-value="sound.enabled"
						@update:model-value="sound.setEnabled($event)"
					/>
				</div>

				<div class="settings__row">
					Повторять звук
					<UiSwitch
						aria-label="Повторять звук"
						:disabled="!sound.enabled"
						:model-value="sound.repeat"
						@update:model-value="sound.setRepeat($event)"
					/>
				</div>

				<div class="settings__row">
					Остановка звука
					<div class="settings__control settings__control--wide">
						<UiSelect
							compact
							aria-label="Остановка звука"
							:disabled="!sound.enabled"
							:options="stopOptions"
							:model-value="sound.stopMode"
							@update:model-value="sound.setStopMode($event as TimerSoundStop)"
						/>
					</div>
				</div>

				<div class="settings__source">
					<div class="settings__track">
						<UiIcon name="volume-2" :size="20" />
						<div class="settings__track-text">
							<span class="settings__track-label">Выбранный звук</span>
							<span class="settings__track-name" :title="sound.customName">
								{{ sound.customName ?? 'Стандартный звук' }}
							</span>
						</div>
					</div>

					<div class="settings__actions">
						<UiButton
							variant="outline"
							size="sm"
							:icon="sound.isPlaying ? 'square' : 'play'"
							@click="sound.preview()"
						>
							{{ sound.isPlaying ? 'Остановить' : 'Прослушать' }}
						</UiButton>
						<UiButton size="sm" icon="upload" @click="sound.choose()">
							Выбрать файл
						</UiButton>
						<UiButton
							v-if="sound.customName"
							variant="ghost"
							size="sm"
							icon="rotate-ccw"
							@click="sound.reset()"
						>
							Вернуть стандартный звук
						</UiButton>
					</div>

					<span v-if="sound.chooseError" class="settings__error" role="alert">
						{{ sound.chooseError }}
					</span>
				</div>
			</UiFormSection>
		</div>
	</UiDialog>
</template>

<style scoped>
.settings {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.settings__row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	min-height: 40px;
	font: var(--type-body-sm);
	color: var(--text-strong);
}

.settings__control {
	width: 120px;
}

.settings__control--wide {
	width: 220px;
}

.settings__divider {
	height: 1px;
	background: var(--border-subtle);
}

.settings__source {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 14px 16px;
	background: var(--surface-sunken);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
}

.settings__track {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
	color: var(--text-muted);
}

.settings__track-text {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.settings__track-label {
	font: var(--type-caption);
	color: var(--text-muted);
}

.settings__track-name {
	overflow: hidden;
	font: 600 var(--fs-14) / var(--lh-snug) var(--font-body);
	color: var(--text-strong);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.settings__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.settings__error {
	font: var(--type-body-sm);
	color: var(--danger);
}
</style>

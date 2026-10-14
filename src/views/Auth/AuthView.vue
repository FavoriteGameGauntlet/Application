<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { HttpErrorResponse } from '../../api-facade/http'
import AppLogo from '../../components/AppLogo.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiTabs from '../../components/ui/UiTabs.vue'
import { RouteName } from '../../router/routeNames'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'

const MIN_PASSWORD_LENGTH = 8

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const tab = ref('Вход')
const isRegister = computed(() => tab.value === 'Регистрация')

const login = ref('')
const password = ref('')
const passwordRepeat = ref('')

const tried = ref(false)
const serverError = ref<string>()

const loginError = computed(() =>
	tried.value && !login.value.trim() ? 'Впиши логин.' : undefined,
)
const passwordError = computed(() =>
	tried.value && password.value.length < MIN_PASSWORD_LENGTH
		? 'Пароль короче 8 символов.'
		: undefined,
)
const passwordRepeatError = computed(() =>
	tried.value && isRegister.value && passwordRepeat.value !== password.value
		? 'Пароли не совпадают.'
		: undefined,
)

const isValid = computed(
	() =>
		!!login.value.trim() &&
		password.value.length >= MIN_PASSWORD_LENGTH &&
		(!isRegister.value || passwordRepeat.value === password.value),
)

watch(tab, () => {
	tried.value = false
	serverError.value = undefined
})

const onSubmit = async () => {
	serverError.value = undefined

	if (!isValid.value) {
		tried.value = true
		return
	}

	const credentials = { login: login.value.trim(), password: password.value }

	try {
		if (isRegister.value) {
			await authStore.signUp(credentials)
		} else {
			await authStore.logIn(credentials)
		}
	} catch (e) {
		const body = (e as HttpErrorResponse).body

		serverError.value =
			body?.code === 'WRONG_AUTH_DATA'
				? 'Неправильный логин или пароль.'
				: (body?.message ?? 'Не получилось войти. Попробуй ещё раз.')
		return
	}

	await router.push({ name: RouteName.Home })

	if (isRegister.value) {
		toastStore.show(
			'Ты в игре',
			'Добавь пару игр в вишлист, чтобы крутить колесо.',
		)
	}
}
</script>

<template>
	<div class="auth">
		<div class="card">
			<span class="card__accent"></span>

			<AppLogo class="card__logo" :height="48" />

			<UiTabs v-model="tab" :items="['Вход', 'Регистрация']" />

			<form class="form" @submit.prevent="onSubmit">
				<div class="form__fields">
					<UiInput
						v-model="login"
						label="Логин"
						placeholder="kirill"
						icon="user"
						:error="loginError"
					/>
					<UiInput
						v-model="password"
						type="password"
						label="Пароль"
						placeholder="••••••••"
						icon="lock"
						hint="Не меньше 8 символов."
						:error="passwordError"
					/>
					<UiInput
						v-if="isRegister"
						v-model="passwordRepeat"
						type="password"
						label="Повтори пароль"
						placeholder="••••••••"
						icon="lock"
						:error="passwordRepeatError"
					/>
				</div>

				<span v-if="serverError" class="form__error">{{ serverError }}</span>

				<UiButton type="submit" size="lg" full-width>
					{{ isRegister ? 'Создать аккаунт' : 'Войти' }}
				</UiButton>
			</form>
		</div>
	</div>
</template>

<style scoped>
.auth {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	min-width: 1100px;
	padding: 24px;
	background: var(--surface-page);
}

.card {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 24px;
	width: 400px;
	padding: 32px;
	background: var(--surface-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-2);
}

.card__accent {
	position: absolute;
	top: 0;
	left: 32px;
	width: 48px;
	height: 4px;
	background: var(--accent);
	border-radius: 0 0 2px 2px;
}

.card__logo {
	align-self: flex-start;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 24px;
	margin: 0;
}

.form__fields {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.form__error {
	font: var(--type-body-sm);
	color: var(--danger-text);
}
</style>

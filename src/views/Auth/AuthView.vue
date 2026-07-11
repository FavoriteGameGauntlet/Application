<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { type HttpErrorResponse } from '../../api-facade/http'
import { usePersistentRef } from '../../composables/usePersistentRef'
import { StoreKey } from '../../services/persistentStorage'
import { useAuthStore } from '../../stores/authStore'
import { RouteName } from '../../router/routeNames'
import UiButton from '../../components/ui/UiButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const authMode = ref<'login' | 'register'>('login')
const isRegisterMode = computed(() => authMode.value === 'register')

const setMode = (mode: 'login' | 'register') => {
	authMode.value = mode
}

const login = ref('')
const password = ref('')
const email = ref('')

const isLoginDirty = ref(false)
const isPasswordDirty = ref(false)
const isEmailDirty = ref(false)

const errors = ref<Partial<Record<'name' | 'password' | 'email', string>>>({})

const isAuthError = ref(false)
const serverError = ref<string>()

const loginInput = useTemplateRef('loginInput')
const passwordInput = useTemplateRef('passwordInput')

// yes, i know this is not optimal and ugly as hell. I don't care. It works.

watch(
	login,
	(name) => {
		if (!name) {
			errors.value.name = 'Обязательное поле'
			return
		}

		if (name.length < 3) {
			errors.value.name = 'Минимальная длина - 3 символов'
			return
		}

		if (name.length > 35) {
			errors.value.name = 'Максимальная длина - 35 символов'
			return
		}

		if (!/^[0-9a-zA-Z_]+$/.test(name)) {
			errors.value.name =
				'Допускаются только латинские буквы, цифры и нижние подчёркивания'
			return
		}

		errors.value.name = undefined
	},
	{ immediate: true },
)

watch(
	email,
	(email) => {
		if (!isRegisterMode.value) {
			errors.value.email = undefined
			return
		}

		if (!email) {
			errors.value.email = 'Обязательное поле'
			return
		}

		if (email.length < 6) {
			errors.value.email = 'Минимальная длина - 6 символов'
			return
		}

		if (email.length > 35) {
			errors.value.email = 'Максимальная длина - 35 символов'
			return
		}

		if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
			errors.value.email = 'Неправильный формат электронной почты'
			return
		}

		errors.value.email = undefined
	},
	{ immediate: true },
)

watch(
	password,
	(password) => {
		if (!password) {
			errors.value.password = 'Обязательное поле'
			return
		}

		if (password.length < 8) {
			errors.value.password = 'Минимальная длина - 8 символов'
			return
		}

		if (password.length > 35) {
			errors.value.password = 'Максимальная длина - 35 символов'
			return
		}

		if (!/^[\w\d !"#$%&'()*+,-.=/:;<?>@[\\\]^_|{}~]+$/.test(password)) {
			errors.value.password =
				'Допускаются только латинские буквы и специальные символы'
			return
		}

		errors.value.password = undefined
	},
	{ immediate: true },
)

const tryLogIn = async () =>
	authStore
		.logIn({ login: login.value, password: password.value })
		.then(() => {
			router.push({ name: RouteName.Timer })
		})
		.catch((e) => {
			if (e.body?.code === 'WRONG_AUTH_DATA') {
				isAuthError.value = true

				return
			}

			throw e
		})

const onLoginSubmit = () => {
	isLoginDirty.value = true
	isPasswordDirty.value = true

	if (errors.value.name || errors.value.password) return

	tryLogIn().catch((e: HttpErrorResponse) => {
		if (e.status === 409) {
			authStore.logOut()

			tryLogIn().then(() => router.push({ name: RouteName.Timer }))
		}
	})
}

const onRegisterSubmit = () => {
	isLoginDirty.value = true
	isEmailDirty.value = true
	isPasswordDirty.value = true

	if (errors.value.name || errors.value.email || errors.value.password) {
		return
	}

	authStore
		.signUp({
			login: login.value,
			password: password.value,
			email: email.value,
		})
		.then(() => {
			router.push({ name: RouteName.Timer })
		})
		.catch((e: HttpErrorResponse) => {
			serverError.value = e.body?.message
		})
}

const onFormSubmit = () => {
	isAuthError.value = false
	serverError.value = undefined

	if (isRegisterMode.value) {
		onRegisterSubmit()
	} else {
		onLoginSubmit()
	}
}

onMounted(async () => {
	// todo fix this mess. This should just work, but it don't
	usePersistentRef(StoreKey.Login, (storedLogin) => {
		login.value = storedLogin ?? ''

		if (login.value) {
			passwordInput.value?.focus()
		} else {
			loginInput.value?.focus()
		}
	})
})
</script>

<template>
	<div class="auth-view">
		<div class="brand-panel">
			<div class="brand-title">FGG3</div>
			<div class="brand-tagline">FAVORITE GAME GAUNTLET</div>
		</div>

		<div class="form-panel">
			<div class="form-container">
				<div class="mode-switch">
					<div
						class="mode-tab"
						:class="{ 'mode-tab--active': !isRegisterMode }"
						@click="setMode('login')"
					>
						Вход
					</div>
					<div
						class="mode-tab"
						:class="{ 'mode-tab--active': isRegisterMode }"
						@click="setMode('register')"
					>
						Регистрация
					</div>
				</div>

				<form class="form" @submit.prevent="onFormSubmit">
					<input
						class="field"
						placeholder="Логин"
						ref="loginInput"
						v-model.trim="login"
						@blur="isLoginDirty = true"
					/>

					<div class="error" v-if="errors.name && isLoginDirty">
						{{ errors.name }}
					</div>

					<input
						v-if="isRegisterMode"
						class="field"
						type="email"
						placeholder="Эл. почта"
						v-model.trim="email"
						@blur="isEmailDirty = true"
					/>

					<div class="error" v-if="isRegisterMode && errors.email && isEmailDirty">
						{{ errors.email }}
					</div>

					<input
						class="field"
						type="password"
						placeholder="Пароль"
						ref="passwordInput"
						v-model="password"
						@blur="isPasswordDirty = true"
					/>

					<div class="error" v-if="errors.password && isPasswordDirty">
						{{ errors.password }}
					</div>

					<div class="error" v-if="serverError">
						{{ serverError }}
					</div>

					<div class="error" v-if="isAuthError">Неправильный логин или пароль.</div>

					<UiButton class="submit-button">{{
						isRegisterMode ? 'создать аккаунт' : 'войти'
					}}</UiButton>
				</form>
			</div>
		</div>
	</div>
</template>

<style scoped>
.auth-view {
	display: flex;
	width: 100%;
	height: 100%;
}

.brand-panel {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
}

.brand-title {
	font-size: 2.5rem;
	font-weight: 800;
}

.brand-tagline {
	margin-top: 8px;
	font-size: 0.875rem;
	color: #64748b;
}

.form-panel {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.form-container {
	display: flex;
	width: 320px;
	flex-direction: column;
	gap: 16px;
}

.mode-switch {
	display: flex;
	gap: 6px;
	border: 1px solid #94a3b8;
	border-radius: 10px;
	padding: 4px;
}

.mode-tab {
	flex: 1;
	text-align: center;
	padding: 8px;
	border-radius: 7px;
	cursor: pointer;
	font-size: 0.875rem;
}

.mode-tab--active {
	background-color: #0f172a;
	color: #fff;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.field {
	border-radius: 6px;
	border: 1px solid #94a3b8;
	padding: 2px 8px;
}

.error {
	display: flex;
	flex-direction: column;
	gap: 4px;
	border-radius: 6px;
	background-color: #fef2f2;
	padding: 4px 8px;
	font-size: 14px;
	line-height: 1.25;
	color: #291e1c;
}

.submit-button {
	height: 48px;
}
</style>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { type HttpErrorResponse } from '../../api-facade/http'
import { usePersistentRef } from '../../composables/usePersistentRef'
import { StoreKey } from '../../services/persistentStorage'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'
import { RouteName } from '../../router/routeNames'
import UiButton from '../../components/ui/UiButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useFeatureUserStore()

const login = ref('')
const password = ref('')

const isLoginDirty = ref(false)
const isPasswordDirty = ref(false)

const errors = ref<Partial<Record<'name' | 'password', string>>>({})

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
			userStore.init()
			router.push({ name: RouteName.Timer })
		})
		.catch((e) => {
			if (e.body?.code === 'WRONG_AUTH_DATA') {
				isAuthError.value = true

				return
			}

			throw e
		})

const onFormSubmit = () => {
	isLoginDirty.value = true
	isPasswordDirty.value = true

	if (Object.values(errors.value).filter(Boolean).length) return

	tryLogIn().catch((e: HttpErrorResponse) => {
		if (e.status === 409) {
			authStore.logOut()

			tryLogIn().then(() => router.push({ name: RouteName.Timer }))
		}
	})
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
	<div class="login-view">
		<h1 class="title">Вход</h1>

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

			<UiButton class="submit-button">Войти</UiButton>

			<div class="signup-link">
				Ещё не участвуешь в ивенте?

				<RouterLink to="signup" class="link"> Зарегистрироваться </RouterLink>
			</div>
		</form>
	</div>
</template>

<style scoped>
.login-view {
	display: grid;
	place-content: center;
	gap: 16px;
	width: 100%;
	height: 100%;
}

.title {
	width: 240px;
	font-size: 1.875rem;
	font-weight: 700;
}

.form {
	display: flex;
	width: 320px;
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

.signup-link {
	place-self: center;
	text-align: center;
	font-size: 14px;
}

.link {
	color: #0e7490;
}
</style>

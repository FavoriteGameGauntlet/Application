<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { type HttpErrorResponse } from '../../api-facade/http'
import UiButton from '../../components/ui/UiButton.vue'
import { useAuthStore } from '../../stores/authStore'
import { useFeatureUserStore } from '../../stores/feature/featureUserStore'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useFeatureUserStore()

const login = ref('')
const password = ref('')
const email = ref('')

const isLoginDirty = ref(false)
const isPasswordDirty = ref(false)
const isEmailDirty = ref(false)

const errors = ref<Partial<Record<'name' | 'password' | 'email', string>>>({})

const serverError = ref<string>()

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

const onFormSubmit = () => {
	isLoginDirty.value = true
	isEmailDirty.value = true
	isPasswordDirty.value = true

	if (Object.values(errors.value).filter(Boolean).length) {
		return
	}

	authStore
		.signUp({
			login: login.value,
			password: password.value,
			email: email.value,
		})
		.then(() => {
			userStore.init()
			router.push('/')
		})
		.catch((e: HttpErrorResponse) => {
			serverError.value = e.body?.message
		})
}
</script>

<template>
	<div class="signup-view">
		<h1 class="title">Регистрация</h1>

		<form class="form" @submit.prevent="onFormSubmit">
			<input
				class="field"
				placeholder="Логин"
				v-model.trim="login"
				@blur="isLoginDirty = true"
			/>

			<div class="error" v-if="errors.name && isLoginDirty">
				{{ errors.name }}
			</div>

			<input
				class="field"
				type="email"
				placeholder="Эл. почта"
				v-model.trim="email"
				@blur="isEmailDirty = true"
			/>

			<div class="error" v-if="errors.email && isEmailDirty">
				{{ errors.email }}
			</div>

			<input
				class="field"
				type="password"
				placeholder="Пароль"
				v-model="password"
				@blur="isPasswordDirty = true"
			/>

			<div class="error" v-if="errors.password && isPasswordDirty">
				{{ errors.password }}
			</div>

			<div class="error" v-if="serverError">
				{{ serverError }}
			</div>

			<UiButton class="submit-button">Зарегистрироваться</UiButton>

			<div class="login-link">
				Уже есть аккаунт?

				<RouterLink to="login" class="link"> Вход </RouterLink>
			</div>
		</form>
	</div>
</template>

<style scoped>
.signup-view {
	display: grid;
	place-content: center;
	gap: 16px;
	width: 100%;
	height: 100%;
}

.title {
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

.login-link {
	place-self: center;
	text-align: center;
	font-size: 14px;
}

.link {
	color: #0e7490;
}
</style>

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 512 * 1024
const MIN_SIDE = 64
const MAX_SIDE = 1024

export const AVATAR_ACCEPT = AVATAR_TYPES.join(',')

export const avatarFileError = async (
	file: File,
): Promise<string | undefined> => {
	if (!AVATAR_TYPES.includes(file.type)) return 'Выбери PNG, JPEG или WebP.'
	if (file.size > MAX_BYTES) return 'Файл больше 512 КиБ.'

	try {
		const image = await createImageBitmap(file)
		const { width, height } = image

		image.close()

		if (
			Math.min(width, height) < MIN_SIDE ||
			Math.max(width, height) > MAX_SIDE
		) {
			return 'Сторона изображения должна быть от 64 до 1024 пикселей.'
		}
	} catch {
		return 'Не удалось открыть изображение.'
	}
}

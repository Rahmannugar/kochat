export const AVATAR_BUCKET = "avatars"
export const CHAT_IMAGE_BUCKET = "chat-images"
export const CHAT_AUDIO_BUCKET = "chat-audio"

export const AVATAR_MAX_SIZE_BYTES = 10 * 1024 * 1024
export const CHAT_IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024
export const CHAT_AUDIO_MAX_SIZE_BYTES = 15 * 1024 * 1024

export const AVATAR_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const CHAT_IMAGE_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
export const CHAT_AUDIO_ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/x-m4a",
]

import { HttpError } from "@/lib/utils/http"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_BUCKET,
  AVATAR_MAX_SIZE_BYTES,
  CHAT_AUDIO_ALLOWED_MIME_TYPES,
  CHAT_AUDIO_BUCKET,
  CHAT_AUDIO_MAX_SIZE_BYTES,
  CHAT_IMAGE_ALLOWED_MIME_TYPES,
  CHAT_IMAGE_BUCKET,
  CHAT_IMAGE_MAX_SIZE_BYTES,
} from "@/lib/storage/storage.constants"

type UploadAssetInput = {
  bucket: string
  path: string
  file: File | Blob
  maxSizeBytes: number
  allowedMimeTypes: string[]
  cacheControl?: string
  upsert?: boolean
}

type UploadBufferAssetInput = {
  bucket: string
  path: string
  buffer: Uint8Array
  contentType: string
  cacheControl?: string
  upsert?: boolean
}

const ensuredBuckets = new Set<string>()

const sanitizeFileName = (fileName: string) => {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-")

  return normalized || "file"
}

const ensureBucket = async (bucket: string, isPublic = false) => {
  if (ensuredBuckets.has(bucket)) {
    return
  }

  const supabase = getSupabaseAdmin()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new HttpError(500, "Failed to inspect storage buckets")
  }

  const exists = buckets.some((existingBucket) => existingBucket.name === bucket)

  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: isPublic,
      fileSizeLimit: undefined,
    })

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new HttpError(500, `Failed to create storage bucket "${bucket}"`)
    }
  }

  ensuredBuckets.add(bucket)
}

const validateFile = ({
  file,
  maxSizeBytes,
  allowedMimeTypes,
}: {
  file: File | Blob
  maxSizeBytes: number
  allowedMimeTypes: string[]
}) => {
  if (file.size > maxSizeBytes) {
    throw new HttpError(400, `File exceeds the maximum size of ${Math.floor(maxSizeBytes / 1024 / 1024)}MB`)
  }

  if (!allowedMimeTypes.includes(file.type)) {
    throw new HttpError(400, "File type is not supported")
  }
}

const uploadAsset = async ({
  bucket,
  path,
  file,
  maxSizeBytes,
  allowedMimeTypes,
  cacheControl = "3600",
  upsert = false,
}: UploadAssetInput) => {
  validateFile({ file, maxSizeBytes, allowedMimeTypes })
  await ensureBucket(bucket, true)

  const supabase = getSupabaseAdmin()
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl,
    upsert,
  })

  if (uploadError) {
    throw new HttpError(500, "Failed to upload file")
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return {
    bucket,
    path,
    publicUrl: data.publicUrl,
    mimeType: file.type,
    size: file.size,
  }
}

const uploadBufferAsset = async ({
  bucket,
  path,
  buffer,
  contentType,
  cacheControl = "3600",
  upsert = false,
}: UploadBufferAssetInput) => {
  await ensureBucket(bucket, true)

  const supabase = getSupabaseAdmin()
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    cacheControl,
    upsert,
  })

  if (uploadError) {
    throw new HttpError(500, "Failed to upload generated asset")
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return {
    bucket,
    path,
    publicUrl: data.publicUrl,
    mimeType: contentType,
    size: buffer.byteLength,
  }
}

const buildAvatarPath = (userId: string, fileName: string) =>
  `${userId}/${Date.now()}-${sanitizeFileName(fileName)}`

const buildChatImagePath = (roomId: string, userId: string, fileName: string) =>
  `${roomId}/${userId}/${Date.now()}-${sanitizeFileName(fileName)}`

const buildChatAudioPath = (roomId: string, userId: string, fileName: string) =>
  `${roomId}/${userId}/${Date.now()}-${sanitizeFileName(fileName)}`

const fileNameFromMimeType = (mimeType: string) => {
  switch (mimeType) {
    case "audio/mpeg":
    case "audio/mp3":
      return "speech.mp3"
    case "audio/mp4":
    case "audio/x-m4a":
      return "speech.m4a"
    case "audio/webm":
      return "speech.webm"
    case "audio/ogg":
      return "speech.ogg"
    default:
      return "speech.wav"
  }
}

export const storageService = {
  uploadAvatar: async (userId: string, file: File) => {
    return uploadAsset({
      bucket: AVATAR_BUCKET,
      path: buildAvatarPath(userId, file.name),
      file,
      maxSizeBytes: AVATAR_MAX_SIZE_BYTES,
      allowedMimeTypes: AVATAR_ALLOWED_MIME_TYPES,
      upsert: true,
    })
  },

  uploadChatImage: async ({
    roomId,
    userId,
    file,
  }: {
    roomId: string
    userId: string
    file: File
  }) => {
    return uploadAsset({
      bucket: CHAT_IMAGE_BUCKET,
      path: buildChatImagePath(roomId, userId, file.name),
      file,
      maxSizeBytes: CHAT_IMAGE_MAX_SIZE_BYTES,
      allowedMimeTypes: CHAT_IMAGE_ALLOWED_MIME_TYPES,
    })
  },

  uploadChatAudio: async ({
    roomId,
    userId,
    file,
  }: {
    roomId: string
    userId: string
    file: File
  }) => {
    return uploadAsset({
      bucket: CHAT_AUDIO_BUCKET,
      path: buildChatAudioPath(roomId, userId, file.name),
      file,
      maxSizeBytes: CHAT_AUDIO_MAX_SIZE_BYTES,
      allowedMimeTypes: CHAT_AUDIO_ALLOWED_MIME_TYPES,
    })
  },

  uploadGeneratedChatAudio: async ({
    roomId,
    fileOwnerId,
    audioBase64,
    mimeType,
  }: {
    roomId: string
    fileOwnerId: string
    audioBase64: string
    mimeType: string
  }) => {
    const buffer = Uint8Array.from(Buffer.from(audioBase64, "base64"))

    if (buffer.byteLength > CHAT_AUDIO_MAX_SIZE_BYTES) {
      throw new HttpError(400, `Audio exceeds the maximum size of ${Math.floor(CHAT_AUDIO_MAX_SIZE_BYTES / 1024 / 1024)}MB`)
    }

    if (!CHAT_AUDIO_ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new HttpError(400, "Generated audio type is not supported")
    }

    return uploadBufferAsset({
      bucket: CHAT_AUDIO_BUCKET,
      path: buildChatAudioPath(roomId, fileOwnerId, fileNameFromMimeType(mimeType)),
      buffer,
      contentType: mimeType,
    })
  },
}

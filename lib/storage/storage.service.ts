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

const sanitizeFileName = (fileName: string) => {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-")

  return normalized || "file"
}

const REQUIRED_BUCKETS = [AVATAR_BUCKET, CHAT_IMAGE_BUCKET, CHAT_AUDIO_BUCKET] as const
const normalizeMimeType = (mimeType: string) => mimeType.split(";")[0]?.trim().toLowerCase() || mimeType

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

  if (!allowedMimeTypes.includes(normalizeMimeType(file.type))) {
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

  const supabase = getSupabaseAdmin()
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl,
    upsert,
  })

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes("bucket")) {
      throw new HttpError(500, `Storage bucket "${bucket}" is not provisioned`)
    }

    throw new HttpError(500, "Failed to upload file")
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return {
    bucket,
    path,
    publicUrl: data.publicUrl,
    mimeType: normalizeMimeType(file.type),
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
  const supabase = getSupabaseAdmin()
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    cacheControl,
    upsert,
  })

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes("bucket")) {
      throw new HttpError(500, `Storage bucket "${bucket}" is not provisioned`)
    }

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

const downloadAssetAsBase64 = async ({
  bucket,
  path,
}: {
  bucket: string
  path: string
}) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.storage.from(bucket).download(path)

  if (error || !data) {
    throw new HttpError(500, "Failed to load stored file")
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  return {
    base64: buffer.toString("base64"),
    mimeType: data.type || "application/octet-stream",
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
  getRequiredBuckets: () => [...REQUIRED_BUCKETS],

  provisionBuckets: async () => {
    const supabase = getSupabaseAdmin()
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new HttpError(500, "Failed to inspect storage buckets")
    }

    const existingBucketNames = new Set(buckets.map((bucket) => bucket.name))

    for (const bucket of REQUIRED_BUCKETS) {
      if (existingBucketNames.has(bucket)) {
        continue
      }

      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
      })

      if (createError && !createError.message.toLowerCase().includes("already exists")) {
        throw new HttpError(500, `Failed to create storage bucket "${bucket}"`)
      }
    }
  },

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

    const normalizedMimeType = normalizeMimeType(mimeType)

    if (!CHAT_AUDIO_ALLOWED_MIME_TYPES.includes(normalizedMimeType)) {
      throw new HttpError(400, "Generated audio type is not supported")
    }

    return uploadBufferAsset({
      bucket: CHAT_AUDIO_BUCKET,
      path: buildChatAudioPath(roomId, fileOwnerId, fileNameFromMimeType(normalizedMimeType)),
      buffer,
      contentType: normalizedMimeType,
    })
  },

  downloadChatImageAsBase64: async (path: string) => {
    return downloadAssetAsBase64({
      bucket: CHAT_IMAGE_BUCKET,
      path,
    })
  },
}

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to provision storage buckets",
  );
}

const REQUIRED_BUCKETS = [
  {
    name: "avatars",
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    name: "chat-images",
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  {
    name: "chat-audio",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
      "audio/x-m4a",
    ],
  },
];

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const { data: buckets, error: listError } =
  await supabase.storage.listBuckets();

if (listError) {
  throw new Error(`Failed to inspect storage buckets: ${listError.message}`);
}

const existingBucketNames = new Set(buckets.map((bucket) => bucket.name));

for (const bucket of REQUIRED_BUCKETS) {
  if (existingBucketNames.has(bucket.name)) {
    const { error: updateError } = await supabase.storage.updateBucket(
      bucket.name,
      {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      },
    );

    if (updateError) {
      throw new Error(
        `Failed to update bucket "${bucket.name}": ${updateError.message}`,
      );
    }

    console.log(`Updated bucket: ${bucket.name}`);
    continue;
  }

  const { error: createError } = await supabase.storage.createBucket(
    bucket.name,
    {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    },
  );

  if (
    createError &&
    !createError.message.toLowerCase().includes("already exists")
  ) {
    throw new Error(
      `Failed to create bucket "${bucket.name}": ${createError.message}`,
    );
  }

  console.log(`Created bucket: ${bucket.name}`);
}

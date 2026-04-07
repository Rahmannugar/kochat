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

const REQUIRED_BUCKETS = ["avatars", "chat-images", "chat-audio"];

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
  if (existingBucketNames.has(bucket)) {
    console.log(`Bucket already exists: ${bucket}`);
    continue;
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
  });

  if (
    createError &&
    !createError.message.toLowerCase().includes("already exists")
  ) {
    throw new Error(
      `Failed to create bucket "${bucket}": ${createError.message}`,
    );
  }

  console.log(`Created bucket: ${bucket}`);
}

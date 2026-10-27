# Cloudflare R2 setup

The Phase 5 media pipeline uses the R2 S3-compatible API for direct uploads. The app stores only object keys and media metadata in Supabase; image bytes stay in R2.

## Create two buckets

Create two buckets in the same Cloudflare account:

- The bucket named by `R2_BUCKET_NAME` is for public profile photos only. Enable public access using the bucket's `r2.dev` URL for a demo, or attach a custom domain. Public profile photos are intentionally publicly readable.
- The bucket named by `R2_PRIVATE_BUCKET_NAME` is for under-18 athlete media and scout identity documents. Keep it private: do not enable public access and do not attach a public domain. The app only grants short-lived, signed GET access to this bucket.

Do not use one public bucket for both kinds of media. R2 public access applies to the bucket; a public route to a shared bucket would expose private objects regardless of the app's signed URLs.

The standard public R2 route (the bucket's `pub-….r2.dev` URL) is acceptable for demos and is entered as `R2_PUBLIC_CUSTOM_DOMAIN`, including `https://`. Cloudflare rate-limits `r2.dev` and does not recommend it for production; for production, attach a domain you control to the public bucket and use that HTTPS origin instead. The S3 API endpoint is not a public image-delivery URL.

## Create R2 API credentials

Create an R2 API token/key in the Cloudflare dashboard with Object Read & Write permissions, scoped to only these two buckets if the dashboard allows bucket-level scope. Copy the Access Key ID and Secret Access Key once. Keep both server-side; never use `NEXT_PUBLIC_` prefixes for them.

The account ID is available on the Cloudflare account home page. The endpoint the app uses is:

```text
https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

## Configure bucket CORS

Add a CORS policy to both buckets that allows your app's exact origin(s), the `PUT` method, and the `Content-Type` request header. For local development, include the local app origin you use (for example `http://localhost:3000`); for production, list only the deployed app origin. Do not use wildcard origins in production.

## Environment

Put real values in the ignored `.env.local` and in the deployment's server environment. `.env.example` contains only blank placeholders:

```dotenv
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PRIVATE_BUCKET_NAME=
R2_PUBLIC_CUSTOM_DOMAIN=
```

`R2_PUBLIC_CUSTOM_DOMAIN` is an HTTPS origin: use the public bucket's `r2.dev` URL or its custom domain. It is optional for private uploads, but public profile photos will not have a delivery URL until it is configured. `R2_PRIVATE_BUCKET_NAME` is additionally required so private uploads cannot be placed in the public bucket.

## Upload and access flow

1. An authenticated user requests `POST /api/media/upload-url`.
2. The app checks role, declared MIME type, size (10 MB max), and the athlete's age. It returns an opaque R2 object key and a 30-minute presigned `PutObject` URL. The URL signs the exact MIME type and content length.
3. The browser uploads the file directly to the correct bucket using `PUT`.
4. `saveMediaAction` verifies the stored object's type and size with `HeadObject`, then writes the object key to `public.profile_media.cloudflare_image_id`.
5. Public media uses the public bucket's R2 route. Private media uses a one-hour presigned `GetObject` URL from the private bucket.

The legacy database column name `cloudflare_image_id` remains unchanged for compatibility; its value is now an R2 object key. No Cloudflare Images variant processing is used. Public image dimensions are constrained in the UI with CSS/Tailwind.

## Checks

- Confirm a public profile photo is reachable through the configured public route.
- Confirm under-18 photos and scout identity documents are in the private bucket, which has no public route.
- Confirm a private delivery URL is signed and expires after one hour.
- Confirm `public.profile_media.cloudflare_image_id` contains the R2 key, not an image URL or file bytes.
- Confirm deleting/replacing a media row deletes the corresponding object from the matching bucket.

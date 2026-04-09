# Kochat

Kochat is a real-time workspace chat application. It combines direct messages, private group rooms, a summonable AI assistant, media sharing, voice features, read receipts, search, installable PWA support, and web push notifications in one app.


## Features

- Email/password authentication with verification, onboarding, and forgot-password flow
- Google and GitHub social sign-in
- Real-time direct messages and group rooms
- Typing indicators and room-scoped presence
- AI assistant invoked with `@ai`
- Image sharing, voice notes, transcription, and AI speech playback
- Read receipts and delivery confirmations
- Room message search with highlighting and jump-to-message
- Installable PWA support and web push notifications

## Running Locally

1. Install dependencies
   - `npm install`
2. Fill `.env.local with .env.example`
3. Generate and apply DB changes
   - `npm run db:generate your-migration-name`
   - `npm run db:push`
4. Create storage buckets
   - `npm run buckets:create`
5. Run the app
   - `npm run dev`

For PWA testing:

- `npm run build`
- `npm run start`

## Environment Variables

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_SECURE=false
AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=gemini-2.5-flash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

## Demo Setup

### App URL

- `https://kochatnet.vercel.app`

### Test Accounts

- User 1
  - Email: `cladeadenugar@gmail.com`
  - Password: `Qwerty20#`
- User 2
  - Email: `opeyemiqwerty@gmail.com`
  - Password: `Qwerty20#`

### Quick Demo Flow

1. Sign in as User 1 in one browser window.
2. Sign in as User 2 in another browser or an incognito window.
3. Start a direct message between the two accounts.
4. Send messages from both sides to test:
   - real-time delivery
   - typing indicators
   - presence
   - read receipts
   - search

### AI Examples

- `@ai explain why docker networking can break after restart`
- `@ai summarize what we have agreed in this conversation`
- `@ai look at this image and tell me what stands out`

### Push Notifications

1. Set the VAPID env vars.
2. Enable notifications from the profile page.
3. Keep one user outside the active room.
4. Send a message from the other account.

## Architecture Overview

Kochat is structured around a clear split:

- `app/`
  - page routes and API routes
  - server entry points
- `components/`
  - auth UI
  - workspace UI
  - shared UI primitives
- `lib/`
  - feature/domain modules such as:
    - `auth`
    - `users`
    - `rooms`
    - `messages`
    - `ai`
    - `push`
    - `realtime`
    - `storage`
  - each module owns the parts it needs, such as:
    - schemas
    - repositories
    - services
    - hooks
    - types

The main design choice was to keep:

- page protection and routing decisions on the server
- domain logic in `lib/*/*.service.ts`
- database access in `*.repository.ts`
- client data and realtime behavior in hooks under `lib`
- UI composition in `components`

## Technology Choices

### Why Supabase

Supabase was chosen for two main reasons:

- it gave the app a clean PostgreSQL-backed foundation for relational chat data
- it solved storage cleanly for avatars, chat images, and audio uploads

### Why BetterAuth

BetterAuth was chosen because it is fast to set up, has no separate paid auth requirement for this project, and gives a complete session/authentication layer out of the box.

It handled:

- email/password auth
- Google auth
- GitHub auth
- email verification
- OTP flows
- forgot password
- session handling

That let the app move quickly while still keeping product-specific rules like onboarding, route access, and profile completion inside the application layer.

### Why PostgreSQL instead of NoSQL

This app fits SQL better than NoSQL because the core domain is relational.

The important entities are tightly connected:

- users
- rooms
- room memberships
- messages
- read state
- subscriptions
- auth accounts and sessions

That makes PostgreSQL a strong fit because:

- memberships and permissions are naturally relational
- room access checks are easier to model safely
- cursor pagination is straightforward on ordered relational records
- read receipts and delivery state are easier to derive from membership state
- uniqueness constraints matter a lot, especially for DMs and usernames
- search, indexing, and reporting can evolve cleanly later

In short, the app benefits from:

- explicit relationships
- constraints
- predictable querying

instead of a more document-oriented data model.

### Why Supabase Realtime for room updates

The app uses Supabase Realtime for room messaging, presence, typing, and receipt events.

Reason:

- it provides managed low-latency channels for chat events without the app owning websocket infrastructure directly
- presence and broadcast features fit room activity naturally, covering active users, typing state, message delivery, and receipt updates in one transport layer
- it works well alongside BetterAuth, while the application keeps the real security boundary on the server through authenticated room access checks before users can load rooms, messages, or room actions

Kochat uses BetterAuth as the primary auth system, so room security is enforced in the application layer through authenticated room membership checks in pages, services, and API routes. Supabase Realtime is used as the transport for live updates rather than the primary access-control system.

## Module Organization

### Auth

- [lib/auth/auth.ts](/Users/macbook/Codes/Projects/kochat/lib/auth/auth.ts)
  - BetterAuth configuration
- [lib/auth/auth.service.ts](/Users/macbook/Codes/Projects/kochat/lib/auth/auth.service.ts)
  - auth flow routing decisions
- [lib/auth/requireAuthUser.ts](/Users/macbook/Codes/Projects/kochat/lib/auth/requireAuthUser.ts)
  - server page gate
- [lib/auth/useAuth.ts](/Users/macbook/Codes/Projects/kochat/lib/auth/useAuth.ts)
  - client auth actions
- [lib/auth/useEmailOtp.ts](/Users/macbook/Codes/Projects/kochat/lib/auth/useEmailOtp.ts)
  - OTP and password reset flows

### Data / persistence

- [lib/db/schema](/Users/macbook/Codes/Projects/kochat/lib/db/schema)
  - Drizzle schema definitions
- [lib/users/user.repository.ts](/Users/macbook/Codes/Projects/kochat/lib/users/user.repository.ts)
- [lib/rooms/room.repository.ts](/Users/macbook/Codes/Projects/kochat/lib/rooms/room.repository.ts)
- [lib/messages/message.repository.ts](/Users/macbook/Codes/Projects/kochat/lib/messages/message.repository.ts)

### Domain services

- [lib/users/user.service.ts](/Users/macbook/Codes/Projects/kochat/lib/users/user.service.ts)
- [lib/rooms/room.service.ts](/Users/macbook/Codes/Projects/kochat/lib/rooms/room.service.ts)
- [lib/messages/message.service.ts](/Users/macbook/Codes/Projects/kochat/lib/messages/message.service.ts)
- [lib/ai/ai.service.ts](/Users/macbook/Codes/Projects/kochat/lib/ai/ai.service.ts)

### Realtime

- [lib/realtime/room-events.ts](/Users/macbook/Codes/Projects/kochat/lib/realtime/room-events.ts)
  - server-side room event broadcasting through Supabase Realtime
- [lib/realtime/room-channel.client.ts](/Users/macbook/Codes/Projects/kochat/lib/realtime/room-channel.client.ts)
  - browser room-channel acquisition
- [lib/rooms/useRoomEvents.ts](/Users/macbook/Codes/Projects/kochat/lib/rooms/useRoomEvents.ts)
  - client room channel subscription

### AI

- [lib/ai/ai-client.ts](/Users/macbook/Codes/Projects/kochat/lib/ai/ai-client.ts)
  - provider selection
- [lib/ai/gemini-ai-client.ts](/Users/macbook/Codes/Projects/kochat/lib/ai/gemini-ai-client.ts)
  - Gemini implementation
- [lib/ai/ai.config.ts](/Users/macbook/Codes/Projects/kochat/lib/ai/ai.config.ts)
  - prompts and AI policy constants

### Push / PWA

- [app/manifest.ts](/Users/macbook/Codes/Projects/kochat/app/manifest.ts)
- [public/sw.js](/Users/macbook/Codes/Projects/kochat/public/sw.js)
- [lib/push/push.service.ts](/Users/macbook/Codes/Projects/kochat/lib/push/push.service.ts)
- [lib/push/usePushNotifications.ts](/Users/macbook/Codes/Projects/kochat/lib/push/usePushNotifications.ts)

## Authentication Flows

### Email/password sign-up

1. User signs up from `/sign-up`.
2. BetterAuth creates the account.
3. Email verification OTP is sent.
4. After verification, the app checks onboarding state.
5. If username is missing, the user is sent to `/onboarding`.
6. Once onboarding is complete, the user enters `/dashboard`.

### Social auth

Supported:

- Google
- GitHub

Flow:

1. User signs in with provider.
2. BetterAuth links or creates the account.
3. Server-side auth routing checks verification/onboarding state.
4. Users missing profile completion are redirected to `/onboarding`.

### Forgot password

Only email/password accounts can reset passwords.

Flow:

1. User opens `/forgot-password`.
2. App requests a password-reset OTP.
3. If the email belongs to a credential account, BetterAuth sends the OTP.
4. Social-only or nonexistent emails receive a generic success response to avoid leaking account existence.
5. User enters OTP and a new password.

### Route protection

The app protects access at multiple levels:

- `proxy.ts` for shallow route gating
- [lib/auth/requireAuthUser.ts](/Users/macbook/Codes/Projects/kochat/lib/auth/requireAuthUser.ts) for server page protection
- [lib/utils/http.ts](/Users/macbook/Codes/Projects/kochat/lib/utils/http.ts) for API route protection

App routes require:

- authenticated session
- verified email
- completed onboarding (`username`)

## How Real-Time Features Work

### Transport

Real-time room updates use Supabase Realtime room channels:

- browser joins a `room:<roomId>` channel
- server publishes room events through Supabase Broadcast

### Event types

Current room events:

- `message.created`
- `typing.updated`
- `presence.updated`
- `receipts.updated`

### Presence

Presence is room-scoped, not global account/session presence.

Flow:

1. While a room is open, the client tracks itself on the private room channel.
2. Supabase Presence maintains the room-scoped active member snapshot.
3. The room listener converts that snapshot into `activeUsers`.
4. If tracking stops or the tab disconnects, the presence entry disappears from the room.

### Typing

Flow:

1. Composer broadcasts `typing.updated` on the room channel.
2. Other subscribed clients receive the typing signal immediately.
3. Typing indicators are kept short-lived on the client with an expiry window.

### Messages

Flow:

1. Client posts a message to `/api/rooms/[roomId]/messages`.
2. Service validates membership and persists the message.
3. Service publishes `message.created`.
4. All subscribed clients update immediately.

### Read receipts / delivery confirmations

Receipts are modeled through room membership read state, not a per-message receipt table.

Flow:

1. Each membership stores `lastReadMessageId` and `lastReadAt`.
2. When the user is effectively at the latest point in the room, the timeline marks the latest message as read.
3. Receipt summaries are derived per message from membership read state.
4. Realtime emits `receipts.updated`, and clients refresh message summaries.

## How the AI Assistant Works

### Invocation

The AI is invoked with `@ai` inside a room message.

### Flow

1. User sends a human message.
2. Message create response returns `invokesAi`.
3. Frontend starts the AI stream for that room when needed.
4. AI service gathers recent room context.
5. Gemini generates a streaming response.
6. Streamed text is shown in the room.
7. Final AI message is persisted as a real room message with `sender = "ai"`.

### Context model

The AI currently sees a recent bounded room window rather than the full conversation history. This is a conscious tradeoff:

- simpler and predictable
- cheaper than long-context history
- good enough for current scope

With more time, this could be upgraded with summarization or smarter context compression.

### Voice features

Supported:

- voice note uploads
- speech-to-text transcription
- text-to-speech for AI replies

The implementation is text-first with media helpers rather than a full voice-first architecture.

## Chat / Message Features

Supported:

- direct messages
- group rooms
- secure join codes for groups
- image sharing
- voice note sharing
- search with highlighting
- jump-to-message from search
- read receipts
- delivery confirmations

### Pagination

- room conversation list: cursor-based, default `10`
- room message history: cursor-based, default `30`
- room member list: cursor-based, default `10`
- search results: cursor-based, default `20`

## Input Validation and Data Integrity

### Invalid or malformed input

The app validates requests using Zod schemas before service logic runs.

Examples:

- message payloads
- room creation/join payloads
- onboarding/profile data
- auth forms
- search and cursor query params

That means malformed requests are rejected at the API boundary instead of reaching repositories blindly.

### Race conditions

This was handled selectively where it mattered most:

- direct message creation
  - backed by unique `dmKey` in the database
  - protects against two concurrent DM creates
- message sending
  - concurrent sends are safe because each message is independently persisted
  - realtime fanout is event-driven after persistence
- AI usage limits
  - enforced through DB-backed quota rows

There are still tradeoffs:

- this is not a globally distributed websocket system
- realtime behavior depends on Supabase Realtime channel access and the application’s room access checks
- acceptable for the project scope, but not a final multi-region collaboration design

## Search Implementation

Current search is acceptable for the project scope because it is:

- room-scoped
- cursor-based
- bounded per request

Tradeoff:

- it is not full-text indexed search yet

With more time, the next upgrade would be:

- PostgreSQL full-text search
- or `pg_trgm` for faster fuzzy matching on larger room histories

## PWA and Push Notifications

### PWA

Current PWA support includes:

- web app manifest
- service worker registration
- installability on supported browsers
- offline fallback page

This is installability and app-shell support, not full offline-first chat syncing.

### Push notifications

The app supports web push notifications through:

- VAPID keys
- browser subscriptions
- service worker push handling
- backend send on new room messages

Current notification behavior:

- notify room members who are not the sender
- skip users currently active in that room

## External Services

- PostgreSQL
- BetterAuth
- Supabase Storage
- Gemini API
- SMTP provider for email delivery
- Web Push VAPID keys for notifications

## Assumptions

- room presence means “active in this room right now,” not global online status
- search is room-scoped rather than cross-workspace
- AI is a helper invoked inside chat, not a primary chatbot surface
- push notifications are device-subscription based, not tied to installed-PWA-only usage

## Tradeoffs and Known Limitations

- realtime delivery depends on Supabase Realtime channel availability and the application’s room access checks remaining the source of truth
- search is not yet full-text indexed
- PWA is installable but not offline-first chat sync
- push notifications require VAPID setup and browser permission
- offline mode falls back gracefully but does not support queued outbound chat actions

## What I Would Improve With More Time

- move search to PostgreSQL full-text or `pg_trgm`
- add richer moderation, reactions, and thread-level collaboration features
- add queued offline actions and smarter cache hydration
- add richer notification preferences per room/user
- add reactions, replies

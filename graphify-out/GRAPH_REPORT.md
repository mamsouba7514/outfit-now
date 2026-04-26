# Graph Report - /Users/bamamadou/outfit-now  (2026-04-26)

## Corpus Check
- 74 files · ~43,186 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 297 nodes · 380 edges · 37 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Infrastructure & Config|Infrastructure & Config]]
- [[_COMMUNITY_AI Composition Pipeline|AI Composition Pipeline]]
- [[_COMMUNITY_Architecture Decisions|Architecture Decisions]]
- [[_COMMUNITY_Styling Rules & Utils|Styling Rules & Utils]]
- [[_COMMUNITY_Mobile Auth & Navigation|Mobile Auth & Navigation]]
- [[_COMMUNITY_Outfit Generation UI|Outfit Generation UI]]
- [[_COMMUNITY_Auth Token Security|Auth Token Security]]
- [[_COMMUNITY_Vector Search & Onboarding|Vector Search & Onboarding]]
- [[_COMMUNITY_Dressing Item Detail|Dressing Item Detail]]
- [[_COMMUNITY_Karl Style Memory|Karl Style Memory]]
- [[_COMMUNITY_Vision AI Pipeline|Vision AI Pipeline]]
- [[_COMMUNITY_Onboarding Flow|Onboarding Flow]]
- [[_COMMUNITY_User Tier & Identity|User Tier & Identity]]
- [[_COMMUNITY_Outfit Type Definitions|Outfit Type Definitions]]
- [[_COMMUNITY_Intro Flow|Intro Flow]]
- [[_COMMUNITY_Dressing List|Dressing List]]
- [[_COMMUNITY_Brief Request Types|Brief Request Types]]
- [[_COMMUNITY_Design Tokens|Design Tokens]]
- [[_COMMUNITY_Module 48|Module 48]]
- [[_COMMUNITY_Module 49|Module 49]]
- [[_COMMUNITY_Module 50|Module 50]]
- [[_COMMUNITY_Module 51|Module 51]]
- [[_COMMUNITY_Module 52|Module 52]]
- [[_COMMUNITY_Module 53|Module 53]]
- [[_COMMUNITY_Module 54|Module 54]]
- [[_COMMUNITY_Module 55|Module 55]]
- [[_COMMUNITY_Module 56|Module 56]]
- [[_COMMUNITY_Module 57|Module 57]]
- [[_COMMUNITY_Module 58|Module 58]]
- [[_COMMUNITY_Module 59|Module 59]]
- [[_COMMUNITY_Module 60|Module 60]]
- [[_COMMUNITY_Module 61|Module 61]]
- [[_COMMUNITY_Module 62|Module 62]]
- [[_COMMUNITY_Module 63|Module 63]]
- [[_COMMUNITY_Module 64|Module 64]]
- [[_COMMUNITY_Module 65|Module 65]]
- [[_COMMUNITY_Module 66|Module 66]]

## God Nodes (most connected - your core abstractions)
1. `prisma (PrismaClient singleton)` - 14 edges
2. `buildApp()` - 13 edges
3. `useAuthStore` - 12 edges
4. `env` - 11 edges
5. `redis (ioredis instance)` - 11 edges
6. `authRoutes()` - 9 edges
7. `vision Worker (BullMQ)` - 9 edges
8. `composition Worker (BullMQ)` - 9 edges
9. `ClaudeStylingProvider` - 8 edges
10. `PineconeClient` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ADR-002: Fastify over Express` --rationale_for--> `buildApp()`  [INFERRED]
  docs/DECISIONS.md → /Users/bamamadou/outfit-now/apps/api/src/server.ts
- `Architecture overview` --references--> `buildApp()`  [INFERRED]
  docs/ARCHITECTURE.md → /Users/bamamadou/outfit-now/apps/api/src/server.ts
- `PineconeClient` --semantically_similar_to--> `PineconeClient`  [INFERRED] [semantically similar]
  /Users/bamamadou/outfit-now/apps/api/src/services/pinecone.ts → apps/api/src/services/pinecone.ts
- `ADR-003: Prisma ORM` --rationale_for--> `prisma (PrismaClient singleton)`  [INFERRED]
  docs/DECISIONS.md → apps/api/src/lib/prisma.ts
- `ShoppingResult interface` --semantically_similar_to--> `SerpApiShoppingService`  [INFERRED] [semantically similar]
  packages/shared-types/src/outfit.ts → apps/api/src/services/shopping/SerpApiShoppingService.ts

## Hyperedges (group relationships)
- **Async image scan pipeline** — dressing_dressingroutes, queue_enqueuevisionjob, visionworker_worker, vision_claudevisionprovider, services_pinecone, prisma_prisma [EXTRACTED 0.95]
- **Dual payment provider tier sync (Stripe + RevenueCat)** — stripe_handlewebhookevent, revenuecat_handlerceevent, prisma_prisma [EXTRACTED 0.90]
- **Refresh token lifecycle (Redis-backed)** — jwt_generaterefreshtoken, jwt_hashtoken, jwt_storerefreshtoken, jwt_validaterefreshtoken, jwt_revokerefreshtoken, redis_redis [EXTRACTED 0.95]
- **Karl AI outfit composition pipeline** — styleprofile_computestyleprofile, styleprofile_buildkarlcontext, composition_claudestylingprovider, composition_rules, composition_stylingutils [EXTRACTED 0.95]
- **Auth token lifecycle (JWT + Redis)** — auth_authroutes, jwt_generaterefreshtoken, jwt_storerefreshtoken, jwt_validaterefreshtoken, jwt_revokerefreshtoken [EXTRACTED 0.95]
- **Mobile onboarding flow** — mobile_rootlayout, mobile_indexscreen, mobile_introscreen, onboarding_index_onboardingscreen [INFERRED 0.85]
- **Scan-to-Dressing item creation flow** — scan_scanscreen, scan_validation_scanvalidationscreen, dressing_id_dressingitemscreen [EXTRACTED 0.95]
- **AI outfit brief generation and review flow** — stylist_stylistscreen, outfits_outfitsscreen, home_outfitcard [INFERRED 0.85]
- **Social post creation from outfit** — social_index_sharemodal, social_index_commentsheet, social_user_userid_userprofilescreen [EXTRACTED 0.90]
- **Core domain model (DressingItem + Outfit + Brief)** — dressing_dressingitem, outfit_outfit, outfit_brief, outfit_briefrequest, outfit_outfitstatus [EXTRACTED 0.95]
- **Design system tokens** — tokens_colors, tokens_typography, tokens_spacing, tokens_shadows [EXTRACTED 1.00]
- **Architectural decisions (ADRs)** — adr_001_monorepo, adr_002_fastify, adr_003_prisma, adr_004_redis_tokens [EXTRACTED 1.00]

## Communities

### Community 0 - "Infrastructure & Config"
Cohesion: 0.1
Nodes (8): avatarRoutes(), dressingRoutes(), enqueueVisionJob(), visionQueue (BullMQ), handleRCEvent(), createPresignedUploadUrl(), enrichPostItems(), formatPost()

### Community 1 - "AI Composition Pipeline"
Cohesion: 0.09
Nodes (24): ClaudeStylingProvider, composition rules (validateRecentUsage, validateColorCoherence, validateNoDuplicatesAcrossOutfits), StylingProvider (interface), stylingUtils (detectTier, extractJson), composition Worker (BullMQ), Architecture overview, ClothingCategory type, DressingItem interface (+16 more)

### Community 2 - "Architecture Decisions"
Cohesion: 0.13
Nodes (20): ADR-001: npm workspaces monorepo, ADR-002: Fastify over Express, ADR-003: Prisma ORM, affiliateRoutes(), briefRoutes(), Architectural Decision Records, env, envSchema (zod) (+12 more)

### Community 3 - "Styling Rules & Utils"
Cohesion: 0.19
Nodes (6): ClaudeStylingProvider, scoreOutfit(), validateColorCoherence(), validateRecentUsage(), detectTier(), extractJson()

### Community 4 - "Mobile Auth & Navigation"
Cohesion: 0.12
Nodes (18): AppLayout, AuthLayout, LoginScreen, SignupScreen, AvatarScreen, FashionMannequin, HomeScreen, OutfitCard (+10 more)

### Community 5 - "Outfit Generation UI"
Cohesion: 0.15
Nodes (5): useWeather, OutfitsScreen, ShoppingCard(), ShoppingSection(), StylistScreen

### Community 6 - "Auth Token Security"
Cohesion: 0.32
Nodes (10): ADR-004: Refresh tokens in Redis, authRoutes(), issueTokens(), generateRefreshToken(), hashToken(), revokeAllUserTokens(), revokeRefreshToken(), storeRefreshToken() (+2 more)

### Community 7 - "Vector Search & Onboarding"
Cohesion: 0.18
Nodes (5): PineconeClient, handleRCEvent, PineconeClient, update(), handleWebhookEvent()

### Community 8 - "Dressing Item Detail"
Cohesion: 0.27
Nodes (5): buildListingText(), handleCopyListing(), handleSaleAction(), handleShare(), openSaleModal()

### Community 9 - "Karl Style Memory"
Cohesion: 0.6
Nodes (5): buildKarlContext(), computeConfidence(), computeStyleProfile(), confidenceLabel(), topN()

### Community 10 - "Vision AI Pipeline"
Cohesion: 0.4
Nodes (1): ClaudeVisionProvider

### Community 13 - "Onboarding Flow"
Cohesion: 0.4
Nodes (2): handleFinish(), handleNext()

### Community 14 - "User Tier & Identity"
Cohesion: 0.33
Nodes (6): Gender type, Tier type, useSubscription, PremiumScreen, OnboardingRequest interface, UserProfile interface

### Community 18 - "Outfit Type Definitions"
Cohesion: 0.5
Nodes (5): AffiliateSuggestion interface, Brief interface, Outfit interface, OutfitStatus type, ShoppingResult interface

### Community 19 - "Intro Flow"
Cohesion: 0.67
Nodes (2): finish(), goNext()

### Community 21 - "Dressing List"
Cohesion: 0.5
Nodes (4): DressingScreen, useDressingStore, ScanScreen, ScanValidationScreen

### Community 23 - "Brief Request Types"
Cohesion: 0.67
Nodes (3): BriefRequest interface, ComposeMode type, Occasion type

### Community 35 - "Design Tokens"
Cohesion: 1.0
Nodes (2): colors (design tokens), typography (design tokens)

### Community 48 - "Module 48"
Cohesion: 1.0
Nodes (1): PushPayload interface

### Community 49 - "Module 49"
Cohesion: 1.0
Nodes (1): VisionJobData interface

### Community 50 - "Module 50"
Cohesion: 1.0
Nodes (1): CompositionJobData interface

### Community 51 - "Module 51"
Cohesion: 1.0
Nodes (1): IntroScreen

### Community 52 - "Module 52"
Cohesion: 1.0
Nodes (1): DressingItemScreen

### Community 53 - "Module 53"
Cohesion: 1.0
Nodes (1): DressingFilters interface

### Community 54 - "Module 54"
Cohesion: 1.0
Nodes (1): PaginatedResponse interface

### Community 55 - "Module 55"
Cohesion: 1.0
Nodes (1): Post interface

### Community 56 - "Module 56"
Cohesion: 1.0
Nodes (1): SocialUser interface

### Community 57 - "Module 57"
Cohesion: 1.0
Nodes (1): FeedResponse interface

### Community 58 - "Module 58"
Cohesion: 1.0
Nodes (1): UpdateProfileRequest interface

### Community 59 - "Module 59"
Cohesion: 1.0
Nodes (1): AuthTokens interface

### Community 60 - "Module 60"
Cohesion: 1.0
Nodes (1): SignupRequest interface

### Community 61 - "Module 61"
Cohesion: 1.0
Nodes (1): LoginRequest interface

### Community 62 - "Module 62"
Cohesion: 1.0
Nodes (1): AppleAuthRequest interface

### Community 63 - "Module 63"
Cohesion: 1.0
Nodes (1): GoogleAuthRequest interface

### Community 64 - "Module 64"
Cohesion: 1.0
Nodes (1): spacing (design tokens)

### Community 65 - "Module 65"
Cohesion: 1.0
Nodes (1): shadows (design tokens)

### Community 66 - "Module 66"
Cohesion: 1.0
Nodes (1): Runbooks

## Knowledge Gaps
- **55 isolated node(s):** `envSchema (zod)`, `PushPayload interface`, `VisionJobData interface`, `CompositionJobData interface`, `fetchImageBuffer` (+50 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Vision AI Pipeline`** (6 nodes): `ClaudeVisionProvider.ts`, `VisionProvider.ts`, `ClaudeVisionProvider`, `.analyze()`, `.constructor()`, `.toValidMime()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Onboarding Flow`** (6 nodes): `index.tsx`, `canProceed()`, `handleFinish()`, `handleNext()`, `toggleColor()`, `toggleStyle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Intro Flow`** (4 nodes): `index.tsx`, `finish()`, `goNext()`, `onScroll()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Design Tokens`** (2 nodes): `colors (design tokens)`, `typography (design tokens)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 48`** (1 nodes): `PushPayload interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 49`** (1 nodes): `VisionJobData interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 50`** (1 nodes): `CompositionJobData interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 51`** (1 nodes): `IntroScreen`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 52`** (1 nodes): `DressingItemScreen`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 53`** (1 nodes): `DressingFilters interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 54`** (1 nodes): `PaginatedResponse interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 55`** (1 nodes): `Post interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 56`** (1 nodes): `SocialUser interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 57`** (1 nodes): `FeedResponse interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 58`** (1 nodes): `UpdateProfileRequest interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 59`** (1 nodes): `AuthTokens interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 60`** (1 nodes): `SignupRequest interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 61`** (1 nodes): `LoginRequest interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 62`** (1 nodes): `AppleAuthRequest interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 63`** (1 nodes): `GoogleAuthRequest interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 64`** (1 nodes): `spacing (design tokens)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 65`** (1 nodes): `shadows (design tokens)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module 66`** (1 nodes): `Runbooks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ClaudeStylingProvider` connect `AI Composition Pipeline` to `Karl Style Memory`, `Architecture Decisions`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `env` connect `Architecture Decisions` to `AI Composition Pipeline`, `Auth Token Security`, `Vector Search & Onboarding`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `prisma (PrismaClient singleton)` connect `Architecture Decisions` to `Infrastructure & Config`, `AI Composition Pipeline`, `Auth Token Security`, `Karl Style Memory`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `buildApp()` (e.g. with `ADR-002: Fastify over Express` and `Architecture overview`) actually correct?**
  _`buildApp()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `envSchema (zod)`, `PushPayload interface`, `VisionJobData interface` to the rest of the system?**
  _55 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Infrastructure & Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `AI Composition Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
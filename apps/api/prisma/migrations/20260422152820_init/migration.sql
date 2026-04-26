-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "ClothingCategory" AS ENUM ('tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags', 'swimwear', 'activewear', 'underwear');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('spring', 'summer', 'autumn', 'winter', 'all');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "BriefStatus" AS ENUM ('pending', 'generating', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "Occasion" AS ENUM ('casual', 'work', 'formal', 'sport', 'evening', 'weekend', 'travel');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "tier" "Tier" NOT NULL DEFAULT 'free',
    "gender" "Gender",
    "stylePreferences" TEXT[],
    "bodyType" TEXT,
    "colorSeason" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "appleId" TEXT,
    "googleId" TEXT,
    "stripeCustomerId" TEXT,
    "exportRequestedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DressingItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "category" "ClothingCategory",
    "primaryColor" TEXT,
    "secondaryColors" TEXT[],
    "styleTags" TEXT[],
    "brand" TEXT,
    "season" "Season"[],
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'pending',
    "scanError" TEXT,
    "scanDurationMs" INTEGER,
    "scanCostCents" INTEGER,
    "vectorId" TEXT,
    "wornCount" INTEGER NOT NULL DEFAULT 0,
    "lastWornAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DressingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BriefStatus" NOT NULL DEFAULT 'pending',
    "occasion" "Occasion" NOT NULL,
    "styleNotes" TEXT,
    "weatherNote" TEXT,
    "colorNote" TEXT,
    "excludeIds" TEXT[],
    "durationMs" INTEGER,
    "totalCostCents" INTEGER,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outfit" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "justification" TEXT,
    "savedAt" TIMESTAMP(3),
    "wornAt" TIMESTAMP(3),
    "discardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutfitItem" (
    "id" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "dressingItemId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "OutfitItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProduct" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "imageUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "vectorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProductSuggestion" (
    "id" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateProductSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "DressingItem_userId_idx" ON "DressingItem"("userId");

-- CreateIndex
CREATE INDEX "DressingItem_userId_category_idx" ON "DressingItem"("userId", "category");

-- CreateIndex
CREATE INDEX "DressingItem_userId_deletedAt_idx" ON "DressingItem"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Brief_userId_idx" ON "Brief"("userId");

-- CreateIndex
CREATE INDEX "Brief_userId_status_idx" ON "Brief"("userId", "status");

-- CreateIndex
CREATE INDEX "Outfit_briefId_idx" ON "Outfit"("briefId");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitItem_outfitId_dressingItemId_key" ON "OutfitItem"("outfitId", "dressingItemId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProduct_externalId_key" ON "AffiliateProduct"("externalId");

-- CreateIndex
CREATE INDEX "AffiliateProduct_network_idx" ON "AffiliateProduct"("network");

-- CreateIndex
CREATE INDEX "AffiliateProduct_isActive_idx" ON "AffiliateProduct"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProductSuggestion_outfitId_key" ON "AffiliateProductSuggestion"("outfitId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_name_idx" ON "Event"("name");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DressingItem" ADD CONSTRAINT "DressingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outfit" ADD CONSTRAINT "Outfit_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitItem" ADD CONSTRAINT "OutfitItem_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitItem" ADD CONSTRAINT "OutfitItem_dressingItemId_fkey" FOREIGN KEY ("dressingItemId") REFERENCES "DressingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProductSuggestion" ADD CONSTRAINT "AffiliateProductSuggestion_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProductSuggestion" ADD CONSTRAINT "AffiliateProductSuggestion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "AffiliateProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

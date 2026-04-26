-- CreateEnum
CREATE TYPE "ComposeMode" AS ENUM ('new', 'dressing', 'mix');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Occasion" ADD VALUE 'date';
ALTER TYPE "Occasion" ADD VALUE 'party';
ALTER TYPE "Occasion" ADD VALUE 'beach';
ALTER TYPE "Occasion" ADD VALUE 'ceremony';
ALTER TYPE "Occasion" ADD VALUE 'gala';
ALTER TYPE "Occasion" ADD VALUE 'dinner';
ALTER TYPE "Occasion" ADD VALUE 'outdoor';

-- AlterTable
ALTER TABLE "Brief" ADD COLUMN     "budget" DOUBLE PRECISION,
ADD COLUMN     "composeMode" "ComposeMode" NOT NULL DEFAULT 'mix',
ADD COLUMN     "styleTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

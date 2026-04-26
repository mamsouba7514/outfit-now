import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { seedAgents } from './seeds/agents.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

const s3 = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'eu-west-3',
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
  forcePathStyle: true,
});

const BUCKET = 'outfit-now';

// Unsplash clothing images (w=800 for reasonable size)
const CLOTHING_IMAGES: Array<{
  url: string;
  filename: string;
  category: string;
  primaryColor: string;
  secondaryColors: string[];
  styleTags: string[];
  brand: string;
  season: string[];
}> = [
  {
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    filename: 'white-tshirt.jpg',
    category: 'tops',
    primaryColor: 'blanc',
    secondaryColors: [],
    styleTags: ['casual', 'basique', 'coton'],
    brand: 'Uniqlo',
    season: ['spring', 'summer', 'all'],
  },
  {
    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
    filename: 'blue-jeans.jpg',
    category: 'bottoms',
    primaryColor: 'bleu denim',
    secondaryColors: [],
    styleTags: ['casual', 'denim', 'slim'],
    brand: 'Levi\'s',
    season: ['spring', 'summer', 'autumn', 'winter'],
  },
  {
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
    filename: 'black-jacket.jpg',
    category: 'outerwear',
    primaryColor: 'noir',
    secondaryColors: [],
    styleTags: ['smart casual', 'veste', 'polyvalent'],
    brand: 'Zara',
    season: ['autumn', 'winter'],
  },
  {
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    filename: 'white-sneakers.jpg',
    category: 'shoes',
    primaryColor: 'blanc',
    secondaryColors: ['gris'],
    styleTags: ['sneakers', 'sport', 'casual'],
    brand: 'Nike',
    season: ['spring', 'summer', 'autumn'],
  },
  {
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
    filename: 'beige-trench.jpg',
    category: 'outerwear',
    primaryColor: 'beige',
    secondaryColors: ['camel'],
    styleTags: ['trench', 'classique', 'élégant'],
    brand: 'Burberry',
    season: ['spring', 'autumn'],
  },
  {
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
    filename: 'black-dress.jpg',
    category: 'dresses',
    primaryColor: 'noir',
    secondaryColors: [],
    styleTags: ['robe', 'soirée', 'élégant'],
    brand: 'Sandro',
    season: ['spring', 'summer', 'autumn'],
  },
  {
    url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
    filename: 'grey-sweater.jpg',
    category: 'tops',
    primaryColor: 'gris',
    secondaryColors: [],
    styleTags: ['pull', 'cozy', 'laine'],
    brand: 'COS',
    season: ['autumn', 'winter'],
  },
  {
    url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80',
    filename: 'brown-loafers.jpg',
    category: 'shoes',
    primaryColor: 'marron',
    secondaryColors: ['cognac'],
    styleTags: ['loafers', 'smart casual', 'cuir'],
    brand: 'Tod\'s',
    season: ['spring', 'summer', 'autumn'],
  },
  {
    url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80',
    filename: 'navy-blazer.jpg',
    category: 'outerwear',
    primaryColor: 'navy',
    secondaryColors: [],
    styleTags: ['blazer', 'business', 'classique'],
    brand: 'Hugo Boss',
    season: ['spring', 'summer', 'autumn', 'winter'],
  },
  {
    url: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80',
    filename: 'white-shirt.jpg',
    category: 'tops',
    primaryColor: 'blanc',
    secondaryColors: [],
    styleTags: ['chemise', 'business', 'basique'],
    brand: 'Sandro',
    season: ['all'],
  },
  {
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    filename: 'black-backpack.jpg',
    category: 'bags',
    primaryColor: 'noir',
    secondaryColors: [],
    styleTags: ['sac à dos', 'minimaliste', 'cuir'],
    brand: 'Herschel',
    season: ['all'],
  },
  {
    url: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&q=80',
    filename: 'khaki-chinos.jpg',
    category: 'bottoms',
    primaryColor: 'kaki',
    secondaryColors: [],
    styleTags: ['chino', 'smart casual', 'polyvalent'],
    brand: 'Ralph Lauren',
    season: ['spring', 'summer', 'autumn'],
  },
];

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'outfit-now-seed/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

async function main() {
  console.log('🌱 Seeding test account...');

  // Cleanup previous seed data
  await prisma.event.deleteMany({});
  await prisma.outfitItem.deleteMany({});
  await prisma.affiliateProductSuggestion.deleteMany({});
  await prisma.outfit.deleteMany({});
  await prisma.brief.deleteMany({});
  await prisma.dressingItem.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({ where: { email: 'test@outfit-now.app' } });

  const passwordHash = await bcrypt.hash('Test123!', 10);

  const user = await prisma.user.create({
    data: {
      email: 'test@outfit-now.app',
      passwordHash,
      firstName: 'Sophie',
      lastName: 'Martin',
      tier: 'premium',
      gender: 'female',
      stylePreferences: ['casual chic', 'minimaliste', 'smart casual'],
      bodyType: 'hourglass',
      colorSeason: 'automne',
      onboardingCompleted: true,
    },
  });

  console.log(`✅ User created: ${user.email} / Test123!`);
  console.log('📸 Downloading and uploading clothing images...');

  const dressingItems = [];

  for (const clothing of CLOTHING_IMAGES) {
    const userId = user.id;
    const imageKey = `dressing/${userId}/${crypto.randomUUID()}.jpg`;

    try {
      process.stdout.write(`  → ${clothing.filename}... `);
      const imageBuffer = await downloadImage(clothing.url);
      await uploadToS3(imageKey, imageBuffer, 'image/jpeg');
      process.stdout.write('✓\n');

      const item = await prisma.dressingItem.create({
        data: {
          userId,
          imageKey,
          thumbnailKey: imageKey,
          category: clothing.category as never,
          primaryColor: clothing.primaryColor,
          secondaryColors: clothing.secondaryColors,
          styleTags: clothing.styleTags,
          brand: clothing.brand,
          season: clothing.season as never,
          scanStatus: 'completed',
          scanDurationMs: Math.floor(Math.random() * 3000) + 800,
          scanCostCents: 2,
          vectorId: crypto.randomUUID(),
          wornCount: Math.floor(Math.random() * 8),
          lastWornAt: Math.random() > 0.4 ? new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000) : null,
        },
      });

      dressingItems.push(item);
    } catch (err) {
      console.error(`  ✗ Failed ${clothing.filename}:`, (err as Error).message);
    }
  }

  console.log(`✅ ${dressingItems.length} dressing items created`);

  // Brief 1 — Casual Weekend
  const tops = dressingItems.filter((i) => i.category === 'tops');
  const bottoms = dressingItems.filter((i) => i.category === 'bottoms');
  const shoes = dressingItems.filter((i) => i.category === 'shoes');
  const outerwear = dressingItems.filter((i) => i.category === 'outerwear');
  const bags = dressingItems.filter((i) => i.category === 'bags');

  if (tops.length && bottoms.length && shoes.length) {
    const brief1 = await prisma.brief.create({
      data: {
        userId: user.id,
        status: 'completed',
        occasion: 'weekend',
        styleNotes: 'Tenue décontractée pour un brunch en ville',
        weatherNote: 'Ensoleillé, 18°C',
        colorNote: 'Tons neutres de préférence',
        durationMs: 4200,
        totalCostCents: 8,
        completedAt: new Date(),
      },
    });

    const outfit1 = await prisma.outfit.create({
      data: {
        briefId: brief1.id,
        score: 0.91,
        justification:
          'Le t-shirt blanc associé au jean slim et aux sneakers blanches forme un look casual chic parfait pour un brunch. Le contraste blanc/denim est intemporel.',
        savedAt: new Date(),
      },
    });

    await prisma.outfitItem.createMany({
      data: [
        { outfitId: outfit1.id, dressingItemId: tops[0].id, role: 'top' },
        { outfitId: outfit1.id, dressingItemId: bottoms[0].id, role: 'bottom' },
        { outfitId: outfit1.id, dressingItemId: shoes[0].id, role: 'shoes' },
        ...(bags.length ? [{ outfitId: outfit1.id, dressingItemId: bags[0].id, role: 'bag' }] : []),
      ],
    });

    // Brief 2 — Work / Smart Casual
    if (outerwear.length && tops.length > 1) {
      const brief2 = await prisma.brief.create({
        data: {
          userId: user.id,
          status: 'completed',
          occasion: 'work',
          styleNotes: 'Réunion client, look professionnel mais pas trop formel',
          weatherNote: 'Nuageux, 14°C',
          durationMs: 3800,
          totalCostCents: 7,
          completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        },
      });

      const whiteShirt = dressingItems.find((i) => i.imageKey.includes('white') && i.category === 'tops') ?? tops[1] ?? tops[0];
      const navyBlazer = dressingItems.find((i) => i.primaryColor === 'navy') ?? outerwear[0];
      const chinosItem = dressingItems.find((i) => i.category === 'bottoms' && i.primaryColor === 'kaki') ?? bottoms[0];
      const loafersItem = dressingItems.find((i) => i.primaryColor === 'marron') ?? shoes[0];

      const outfit2 = await prisma.outfit.create({
        data: {
          briefId: brief2.id,
          score: 0.88,
          justification:
            'Blazer navy sur chemise blanche avec un chino kaki : combo smart casual élégant pour une réunion client. Les loafers cognac apportent une touche chaude.',
        },
      });

      const outfit2Items = [
        { outfitId: outfit2.id, dressingItemId: whiteShirt.id, role: 'top' },
        { outfitId: outfit2.id, dressingItemId: navyBlazer.id, role: 'outerwear' },
        { outfitId: outfit2.id, dressingItemId: chinosItem.id, role: 'bottom' },
        { outfitId: outfit2.id, dressingItemId: loafersItem.id, role: 'shoes' },
      ];

      // Remove duplicates by dressingItemId
      const seen = new Set<string>();
      const uniqueItems = outfit2Items.filter((i) => {
        if (seen.has(i.dressingItemId)) return false;
        seen.add(i.dressingItemId);
        return true;
      });

      await prisma.outfitItem.createMany({ data: uniqueItems });
    }

    console.log('✅ 2 briefs + outfits created');
  }

  // Affiliate products
  await prisma.affiliateProduct.createMany({
    data: [
      {
        externalId: 'af-001',
        network: 'awin',
        name: 'T-shirt col rond en coton bio',
        brand: 'Uniqlo',
        category: 'tops',
        price: 19.90,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
        affiliateUrl: 'https://www.uniqlo.com',
        vectorId: crypto.randomUUID(),
        isActive: true,
      },
      {
        externalId: 'af-002',
        network: 'awin',
        name: 'Jean slim taille haute',
        brand: "Levi's",
        category: 'bottoms',
        price: 89.95,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
        affiliateUrl: 'https://www.levi.com',
        vectorId: crypto.randomUUID(),
        isActive: true,
      },
      {
        externalId: 'af-003',
        network: 'tradedoubler',
        name: 'Veste légère printemps',
        brand: 'Zara',
        category: 'outerwear',
        price: 59.99,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
        affiliateUrl: 'https://www.zara.com',
        vectorId: crypto.randomUUID(),
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ 3 affiliate products created');

  // Events
  await prisma.event.createMany({
    data: [
      { userId: user.id, name: 'user.signup', payload: { method: 'email' } },
      { userId: user.id, name: 'user.onboarding_completed', payload: {} },
      ...dressingItems.slice(0, 4).map((item) => ({
        userId: user.id,
        name: 'scan.completed',
        payload: { itemId: item.id, category: item.category },
      })),
    ],
  });

  await seedAgents(prisma);

  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email    : test@outfit-now.app');
  console.log('  Password : Test123!');
  console.log('  Tier     : premium');
  console.log(`  Items    : ${dressingItems.length} vêtements`);
  console.log('  Outfits  : 2 tenues générées');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

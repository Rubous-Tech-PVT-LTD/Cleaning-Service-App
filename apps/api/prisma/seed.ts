import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/marketplace_db?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('Clearing old data...');
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();

  console.log('Seeding categories and services...');

  // 1. Cleaning
  const cleaning = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Cleaning', hi: 'सफाई' },
      slug: 'cleaning',
      iconUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445173/home-services_c7gaql.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: cleaning.id, nameTranslations: { en: 'Home Cleaning', hi: 'घर की सफाई' }, descriptionTranslations: { en: 'Full home cleaning service', hi: 'पूर्ण घर की सफाई सेवा' }, basePrice: 1499, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=800' },
      { categoryId: cleaning.id, nameTranslations: { en: 'Deep Cleaning', hi: 'डीप क्लीनिंग' }, descriptionTranslations: { en: 'Intensive deep cleaning', hi: 'गहन डीप क्लीनिंग' }, basePrice: 2499, imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?q=80&w=800' },
      { categoryId: cleaning.id, nameTranslations: { en: 'Bathroom Cleaning', hi: 'बाथरूम की सफाई' }, descriptionTranslations: { en: 'Professional bathroom cleaning', hi: 'पेशेवर बाथरूम सफाई' }, basePrice: 499, imageUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445170/female-bathroom-cleaner_iym2s9.png' },
      { categoryId: cleaning.id, nameTranslations: { en: 'Sofa / Carpet Cleaning', hi: 'सोफा / कालीन सफाई' }, descriptionTranslations: { en: 'Sofa and carpet dry cleaning', hi: 'सोफा और कालीन ड्राई क्लीनिंग' }, basePrice: 799, imageUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445173/female-sofa-cleaner_b4nv6v.png' },
    ]
  });

  // 2. Plumbing
  const plumbing = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Plumbing', hi: 'प्लंबिंग' },
      slug: 'plumbing',
      iconUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445181/plumber_jjcdg0.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: plumbing.id, nameTranslations: { en: 'Tap Repair', hi: 'नल की मरम्मत' }, descriptionTranslations: { en: 'Fix leaking or broken taps', hi: 'टपकते नल को ठीक करें' }, basePrice: 149, imageUrl: 'https://images.unsplash.com/photo-1585938389612-a552a28d6914?q=80&w=800' },
      { categoryId: plumbing.id, nameTranslations: { en: 'Pipe Leakage', hi: 'पाइप लीकेज' }, descriptionTranslations: { en: 'Repair water pipe leaks', hi: 'पाइप लीकेज की मरम्मत' }, basePrice: 299, imageUrl: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?q=80&w=800' },
      { categoryId: plumbing.id, nameTranslations: { en: 'Bathroom Fittings', hi: 'बाथरूम फिटिंग' }, descriptionTranslations: { en: 'Install bathroom accessories', hi: 'बाथरूम फिटिंग स्थापित करें' }, basePrice: 599, imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800' },
      { categoryId: plumbing.id, nameTranslations: { en: 'Kitchen Sink Repair', hi: 'किचन सिंक मरम्मत' }, descriptionTranslations: { en: 'Fix kitchen sink issues', hi: 'किचन सिंक ठीक करें' }, basePrice: 249, imageUrl: 'https://images.unsplash.com/photo-1584622781564-1d9876a13d00?q=80&w=800' },
    ]
  });

  // 3. Electrical
  const electrical = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Electrical', hi: 'इलेक्ट्रिकल' },
      slug: 'electrical',
      iconUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445167/electric_ev354t.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: electrical.id, nameTranslations: { en: 'Switch Repair', hi: 'स्विच मरम्मत' }, descriptionTranslations: { en: 'Repair faulty switches', hi: 'खराब स्विच की मरम्मत' }, basePrice: 99, imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800' },
      { categoryId: electrical.id, nameTranslations: { en: 'Fan Installation', hi: 'पंखा इंस्टालेशन' }, descriptionTranslations: { en: 'Install ceiling or exhaust fans', hi: 'पंखा स्थापित करें' }, basePrice: 199, imageUrl: 'https://images.unsplash.com/photo-1565151443-32198d54c27a?q=80&w=800' },
      { categoryId: electrical.id, nameTranslations: { en: 'Wiring Issues', hi: 'वायरिंग समस्या' }, descriptionTranslations: { en: 'Fix electrical wiring faults', hi: 'वायरिंग दोष ठीक करें' }, basePrice: 399, imageUrl: 'https://images.unsplash.com/photo-1558389186-438424b00a32?q=80&w=800' },
      { categoryId: electrical.id, nameTranslations: { en: 'Light Installation', hi: 'लाइट इंस्टालेशन' }, descriptionTranslations: { en: 'Install lights and fixtures', hi: 'लाइट स्थापित करें' }, basePrice: 149, imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800' },
    ]
  });

  // 4. Painting & Renovation
  const painting = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Painting', hi: 'पेंटिंग' },
      slug: 'painting',
      iconUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445174/wall-painting_u4rpc2.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: painting.id, nameTranslations: { en: 'Wall Painting', hi: 'दीवार पेंटिंग' }, descriptionTranslations: { en: 'Professional wall painting', hi: 'पेशेवर दीवार पेंटिंग' }, basePrice: 1999, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800' },
      { categoryId: painting.id, nameTranslations: { en: 'Putty Work', hi: 'पुट्टी वर्क' }, descriptionTranslations: { en: 'Wall smoothing and putty', hi: 'दीवार चिकनी और पुट्टी' }, basePrice: 999, imageUrl: 'https://images.unsplash.com/photo-1595844730298-b9f0ff98ffd0?q=80&w=800' },
      { categoryId: painting.id, nameTranslations: { en: 'Interior Design', hi: 'इंटीरियर डिजाइन' }, descriptionTranslations: { en: 'Complete room interior styling', hi: 'इंटीरियर डिजाइन सेवा' }, basePrice: 4999, imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800' },
      { categoryId: painting.id, nameTranslations: { en: 'Minor Renovation', hi: 'माइनर रिनोベーション' }, descriptionTranslations: { en: 'Small house renovations', hi: 'छोटे नवीनीकरण कार्य' }, basePrice: 2999, imageUrl: 'https://images.unsplash.com/photo-1503387762-592dea58ef21?q=80&w=800' },
    ]
  });

  // 5. Labour
  const labour = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Labour', hi: 'मज़दूर' },
      slug: 'labour',
      iconUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445175/labour_qxjaxk.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: labour.id, nameTranslations: { en: 'General Labour', hi: 'सामान्य मज़दूर' }, descriptionTranslations: { en: 'Helper for shifting, cleaning, or general tasks', hi: 'शिफ्टिंग या सामान्य कार्यों के लिए सहायक' }, basePrice: 500, imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800' },
      { categoryId: labour.id, nameTranslations: { en: 'Construction Helper', hi: 'निर्माण सहायक' }, descriptionTranslations: { en: 'Skilled helper for construction work', hi: 'निर्माण कार्य के लिए कुशल सहायक' }, basePrice: 700, imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800' },
    ]
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

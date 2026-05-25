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
      iconUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779722804/cleaning-img_e0asab.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: cleaning.id, nameTranslations: { en: 'Home Cleaning', hi: 'घर की सफाई' }, descriptionTranslations: { en: 'Full home cleaning service', hi: 'पूर्ण घर की सफाई सेवा' }, basePrice: 1499, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/f_auto,q_auto/female-home-cleaner_tdsya1.png' },
      { categoryId: cleaning.id, nameTranslations: { en: 'Deep Cleaning', hi: 'डीप क्लीनिंग' }, descriptionTranslations: { en: 'Intensive deep cleaning', hi: 'गहन डीप क्लीनिंग' }, basePrice: 2499, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717205/male-deep-cleaner_u22xoo.png' },
      { categoryId: cleaning.id, nameTranslations: { en: 'Bathroom Cleaning', hi: 'बाथरूम की सफाई' }, descriptionTranslations: { en: 'Professional bathroom cleaning', hi: 'पेशेवर बाथरूम सफाई' }, basePrice: 499, imageUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445170/female-bathroom-cleaner_iym2s9.png' },
      { categoryId: cleaning.id, nameTranslations: { en: 'Sofa / Carpet Cleaning', hi: 'सोफा / कालीन सफाई' }, descriptionTranslations: { en: 'Sofa and carpet dry cleaning', hi: 'सोफा और कालीन ड्राई क्लीनिंग' }, basePrice: 799, imageUrl: 'https://res.cloudinary.com/dfi6krhcl/image/upload/f_auto,q_auto/v1779445173/female-sofa-cleaner_b4nv6v.png' },
    ]
  });

  // 2. Plumbing
  const plumbing = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Plumbing', hi: 'प्लंबिंग' },
      slug: 'plumbing',
      iconUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723355/plumbing_md3pfq.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: plumbing.id, nameTranslations: { en: 'Tap Repair', hi: 'नल की मरम्मत' }, descriptionTranslations: { en: 'Fix leaking or broken taps', hi: 'टपकते नल को ठीक करें' }, basePrice: 149, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717494/tap-repair_glfttp.png' },
      { categoryId: plumbing.id, nameTranslations: { en: 'Pipe Leakage', hi: 'पाइप लीकेज' }, descriptionTranslations: { en: 'Repair water pipe leaks', hi: 'पाइप लीकेज की मरम्मत' }, basePrice: 299, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717573/pipeline-leakage_pjyxqj.png' },
      { categoryId: plumbing.id, nameTranslations: { en: 'Bathroom Fittings', hi: 'बाथरूम फिटिंग' }, descriptionTranslations: { en: 'Install bathroom accessories', hi: 'बाथरूम फिटिंग स्थापित करें' }, basePrice: 599, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717641/bathroom-fittings_br12bm.png' },
      { categoryId: plumbing.id, nameTranslations: { en: 'Kitchen Sink Repair', hi: 'किचन सिंक मरम्मत' }, descriptionTranslations: { en: 'Fix kitchen sink issues', hi: 'किचन सिंक ठीक करें' }, basePrice: 249, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717704/sink-repair_uhvsz8.png' },
    ]
  });

  // 3. Electrical
  const electrical = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Electrical', hi: 'इलेक्ट्रिकल' },
      slug: 'electrical',
      iconUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723318/electrical_qemnav.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: electrical.id, nameTranslations: { en: 'Switch Repair', hi: 'स्विच मरम्मत' }, descriptionTranslations: { en: 'Repair faulty switches', hi: 'खराब स्विच की मरम्मत' }, basePrice: 99, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717815/switch-repair_shc5nx.png' },
      { categoryId: electrical.id, nameTranslations: { en: 'Fan Installation', hi: 'पंखा इंस्टालेशन' }, descriptionTranslations: { en: 'Install ceiling or exhaust fans', hi: 'पंखा स्थापित करें' }, basePrice: 199, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717866/fan-installation_l1qqsn.png' },
      { categoryId: electrical.id, nameTranslations: { en: 'Wiring Issues', hi: 'वायरिंग समस्या' }, descriptionTranslations: { en: 'Fix electrical wiring faults', hi: 'वायरिंग दोष ठीक करें' }, basePrice: 399, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717933/wiring-issues_pfwogr.png' },
      { categoryId: electrical.id, nameTranslations: { en: 'Light Installation', hi: 'लाइट इंस्टालेशन' }, descriptionTranslations: { en: 'Install lights and fixtures', hi: 'लाइट स्थापित करें' }, basePrice: 149, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779717993/light-installation_kopnhj.png' },
    ]
  });

  // 4. Painting & Renovation
  const painting = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Painting', hi: 'पेंटिंग' },
      slug: 'painting',
      iconUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723272/painting_xqchmr.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: painting.id, nameTranslations: { en: 'Wall Painting', hi: 'दीवार पेंटिंग' }, descriptionTranslations: { en: 'Professional wall painting', hi: 'पेशेवर दीवार पेंटिंग' }, basePrice: 1999, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779718090/painting_l5moew.png' },
      { categoryId: painting.id, nameTranslations: { en: 'Putty Work', hi: 'पुट्टी वर्क' }, descriptionTranslations: { en: 'Wall smoothing and putty', hi: 'दीवार चिकनी और पुट्टी' }, basePrice: 999, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779718501/putty-work_r3gybl.png' },
      { categoryId: painting.id, nameTranslations: { en: 'Interior Design', hi: 'इंटीरियर डिजाइन' }, descriptionTranslations: { en: 'Complete room interior styling', hi: 'इंटीरियर डिजाइन सेवा' }, basePrice: 4999, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779718556/interior-design_wlox56.png' },
      { categoryId: painting.id, nameTranslations: { en: 'Minor Renovation', hi: 'माइनर रिनोベーション' }, descriptionTranslations: { en: 'Small house renovations', hi: 'छोटे नवीनीकरण कार्य' }, basePrice: 2999, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779718613/minor-renovation_bgwjic.png' },
    ]
  });

  // 5. Labour
  const labour = await prisma.category.create({
    data: {
      nameTranslations: { en: 'Labour', hi: 'मज़दूर' },
      slug: 'labour',
      iconUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723232/labour_lrajer.png',
    }
  });
  await prisma.service.createMany({
    data: [
      { categoryId: labour.id, nameTranslations: { en: 'General Labour', hi: 'सामान्य मज़दूर' }, descriptionTranslations: { en: 'Helper for shifting, cleaning, or general tasks', hi: 'शिफ्टिंग या सामान्य कार्यों के लिए सहायक' }, basePrice: 500, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779718674/general-labour_bajurj.png' },
      { categoryId: labour.id, nameTranslations: { en: 'Construction Helper', hi: 'निर्माण सहायक' }, descriptionTranslations: { en: 'Skilled helper for construction work', hi: 'निर्माण कार्य के लिए कुशल सहायक' }, basePrice: 700, imageUrl: 'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779718713/construction-helper_jyngl0.png' },
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

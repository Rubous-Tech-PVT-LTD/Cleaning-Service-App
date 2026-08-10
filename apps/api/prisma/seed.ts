import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({
  path: path.join(__dirname, '../.env'),
});

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/marketplace_db?schema=public';

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting database seed...');

  // ---------------------------------------------------------
  // CLEAR EXISTING CATEGORY DATA
  // ---------------------------------------------------------

  console.log('🧹 Clearing existing services...');
  await prisma.service.deleteMany();

  console.log('🧹 Clearing existing subcategories...');
  await (prisma as any).subcategory.deleteMany();

  console.log('🧹 Clearing existing categories...');
  await prisma.category.deleteMany();

  // ---------------------------------------------------------
  // 1. DAILY HOME HELP
  // ---------------------------------------------------------

  const dailyHomeHelp = await prisma.category.create({
    data: {
      nameTranslations: {
        en: 'Daily Home Help',
        hi: 'दैनिक घरेलू सहायता',
      },
      slug: 'daily-home-help',
      iconUrl:
        'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779722804/cleaning-img_e0asab.png',
      order: 1,
    },
  });

  console.log(`✅ Created category: ${dailyHomeHelp.nameTranslations}`);

  // ---------------------------------------------------------
  // DAILY HOME HELP SERVICES
  // ---------------------------------------------------------

  const services = [
    {
      nameTranslations: {
        en: 'Bathroom',
        hi: 'बाथरूम',
      },
      descriptionTranslations: {
        en: 'Professional bathroom cleaning service',
        hi: 'पेशेवर बाथरूम सफाई सेवा',
      },
      basePrice: 299,
    },
    {
      nameTranslations: {
        en: 'Kitchen cleaning',
        hi: 'रसोईघर सफाई',
      },
      descriptionTranslations: {
        en: 'Complete kitchen cleaning and sanitization',
        hi: 'पूर्ण रसोईघर सफाई और सेनिटाइजेशन',
      },
      basePrice: 399,
    },
    {
      nameTranslations: {
        en: 'Cooking',
        hi: 'खाना बनाना',
      },
      descriptionTranslations: {
        en: 'Home cooking service',
        hi: 'घरेलू खाना बनाने की सेवा',
      },
      basePrice: 499,
    },
    {
      nameTranslations: {
        en: 'Dishes',
        hi: 'बर्तन',
      },
      descriptionTranslations: {
        en: 'Dishwashing service',
        hi: 'बर्तन धोने की सेवा',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'Mopping and sweeping',
        hi: 'पोंछा और झाड़ू',
      },
      descriptionTranslations: {
        en: 'Floor mopping and sweeping',
        hi: 'फर्श पोंछा और झाड़ू',
      },
      basePrice: 249,
    },
    {
      nameTranslations: {
        en: 'Dusting and wiping',
        hi: 'धूल और पोंछा',
      },
      descriptionTranslations: {
        en: 'Dusting and surface wiping',
        hi: 'धूल और सतह पोंछा',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'Laundry',
        hi: 'कपड़े धोना',
      },
      descriptionTranslations: {
        en: 'Clothes washing service',
        hi: 'कपड़े धोने की सेवा',
      },
      basePrice: 599,
    },
    {
      nameTranslations: {
        en: 'Ironing',
        hi: 'इस्त्री',
      },
      descriptionTranslations: {
        en: 'Clothes ironing service',
        hi: 'कपड़े इस्त्री की सेवा',
      },
      basePrice: 399,
    },
    {
      nameTranslations: {
        en: 'Complete bedroom cleaning',
        hi: 'पूर्ण बेडरूम सफाई',
      },
      descriptionTranslations: {
        en: 'Complete bedroom cleaning service',
        hi: 'पूर्ण बेडरूम सफाई सेवा',
      },
      basePrice: 699,
    },
    {
      nameTranslations: {
        en: 'Fan cleaning',
        hi: 'पंखा सफाई',
      },
      descriptionTranslations: {
        en: 'Ceiling fan cleaning',
        hi: 'पंखा सफाई',
      },
      basePrice: 149,
    },
    {
      nameTranslations: {
        en: 'Fridge cleaning',
        hi: 'फ्रिज सफाई',
      },
      descriptionTranslations: {
        en: 'Refrigerator cleaning service',
        hi: 'रेफ्रिजरेटर सफाई सेवा',
      },
      basePrice: 449,
    },
    {
      nameTranslations: {
        en: 'Terrace/ Verandah cleaning',
        hi: 'छत/बरामदा सफाई',
      },
      descriptionTranslations: {
        en: 'Terrace and verandah cleaning',
        hi: 'छत और बरामदा सफाई',
      },
      basePrice: 799,
    },
    {
      nameTranslations: {
        en: 'Sofa cleaning',
        hi: 'सोफा सफाई',
      },
      descriptionTranslations: {
        en: 'Sofa deep cleaning service',
        hi: 'सोफा गहरी सफाई सेवा',
      },
      basePrice: 899,
    },
    {
      nameTranslations: {
        en: 'Carpet cleaning',
        hi: 'कालीन सफाई',
      },
      descriptionTranslations: {
        en: 'Carpet and rug cleaning',
        hi: 'कालीन और गलीचा सफाई',
      },
      basePrice: 599,
    },
  ];

  for (const service of services) {
    await (prisma as any).service.create({
      data: {
        categoryId: dailyHomeHelp.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        status: 'ACTIVE',
      },
    });
    console.log(`  └── ✅ Created service: ${service.nameTranslations.en}`);
  }

  // ---------------------------------------------------------
  // 2. REPAIR AND FIXTURES
  // ---------------------------------------------------------

  const repairAndFixtures = await prisma.category.create({
    data: {
      nameTranslations: {
        en: 'Repair and Fixtures',
        hi: 'मरम्मत और फिक्स्चर',
      },
      slug: 'repair-and-fixtures',
      iconUrl:
        'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723355/plumbing_md3pfq.png',
      order: 2,
    },
  });

  console.log('✅ Created category: Repair and Fixtures');

  // ---------------------------------------------------------
  // REPAIR AND FIXTURES SUBCATEGORIES
  // ---------------------------------------------------------

  const plumbing = await (prisma as any).subcategory.create({
    data: {
      categoryId: repairAndFixtures.id,
      nameTranslations: {
        en: 'Plumber',
        hi: 'प्लंबिंग',
      },
      slug: 'plumbing',
      iconUrl:
        'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723355/plumbing_md3pfq.png',
    },
  });

  console.log('  └── ✅ Created subcategory: Plumbing');

  const electrical = await (prisma as any).subcategory.create({
    data: {
      categoryId: repairAndFixtures.id,
      nameTranslations: {
        en: 'Electrical',
        hi: 'इलेक्ट्रिकल',
      },
      slug: 'electrical',
      iconUrl:
        'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723318/electrical_qemnav.png',
    },
  });

  console.log('  └── ✅ Created subcategory: Electrical');

  // ---------------------------------------------------------
  // PLUMBING SERVICES
  // ---------------------------------------------------------

  const plumbingServices = [
    {
      nameTranslations: {
        en: 'Tap repair',
        hi: 'नल मरम्मत',
      },
      descriptionTranslations: {
        en: 'Tap repair and replacement services',
        hi: 'नल मरम्मत और प्रतिस्थापन सेवाएं',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'Shower repair',
        hi: 'शावर मरम्मत',
      },
      descriptionTranslations: {
        en: 'Shower repair and maintenance',
        hi: 'शावर मरम्मत और रखरखाव',
      },
      basePrice: 249,
    },
    {
      nameTranslations: {
        en: 'Motor repair',
        hi: 'मोटर मरम्मत',
      },
      descriptionTranslations: {
        en: 'Water motor repair services',
        hi: 'पानी के मोटर की मरम्मत सेवाएं',
      },
      basePrice: 499,
    },
    {
      nameTranslations: {
        en: 'Pipe leakage',
        hi: 'पाइप लीक',
      },
      descriptionTranslations: {
        en: 'Pipe leakage detection and repair',
        hi: 'पाइप लीक का पता लगाना और मरम्मत',
      },
      basePrice: 349,
    },
    {
      nameTranslations: {
        en: 'Toilet flush repair',
        hi: 'शौचालय फ्लश मरम्मत',
      },
      descriptionTranslations: {
        en: 'Toilet flush mechanism repair',
        hi: 'शौचालय फ्लश तंत्र मरम्मत',
      },
      basePrice: 299,
    },
    {
      nameTranslations: {
        en: 'Jet spray repair',
        hi: 'जेट स्प्रे मरम्मत',
      },
      descriptionTranslations: {
        en: 'Jet spray repair and maintenance',
        hi: 'जेट स्प्रे मरम्मत और रखरखाव',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'Other Plumbing services (Hourly basis)',
        hi: 'अन्य प्लंबिंग सेवाएं (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Other plumbing services on hourly basis',
        hi: 'प्रति घंटा आधार पर अन्य प्लंबिंग सेवाएं',
      },
      basePrice: 399,
    },
  ];

  for (const service of plumbingServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: repairAndFixtures.id,
        subcategoryId: plumbing.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        status: 'ACTIVE',
      },
    });
    console.log(`    └── ✅ Created service: ${service.nameTranslations.en}`);
  }

  // ---------------------------------------------------------
  // ELECTRICAL SERVICES
  // ---------------------------------------------------------

  const electricalServices = [
    {
      nameTranslations: {
        en: 'Lights installation',
        hi: 'लाइट्स इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'Light fixtures installation',
        hi: 'लाइट फिक्स्चर इंस्टालेशन',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'Wiring repair (Hourly basis)',
        hi: 'वायरिंग मरम्मत (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Electrical wiring repair on hourly basis',
        hi: 'प्रति घंटा आधार पर इलेक्ट्रिकल वायरिंग मरम्मत',
      },
      basePrice: 349,
    },
    {
      nameTranslations: {
        en: 'Fan Installation',
        hi: 'पंखा इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'Ceiling fan installation',
        hi: 'सीलिंग पंखा इंस्टालेशन',
      },
      basePrice: 299,
    },
    {
      nameTranslations: {
        en: 'Fan repair',
        hi: 'पंखा मरम्मत',
      },
      descriptionTranslations: {
        en: 'Ceiling fan repair',
        hi: 'सीलिंग पंखा मरम्मत',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'Washing machine repair',
        hi: 'वॉशिंग मशीन मरम्मत',
      },
      descriptionTranslations: {
        en: 'Washing machine repair',
        hi: 'वॉशिंग मशीन मरम्मत',
      },
      basePrice: 499,
    },
    {
      nameTranslations: {
        en: 'Washing machine installation',
        hi: 'वॉशिंग मशीन इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'Washing machine installation',
        hi: 'वॉशिंग मशीन इंस्टालेशन',
      },
      basePrice: 399,
    },
    {
      nameTranslations: {
        en: 'Ac installation',
        hi: 'एसी इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'Air conditioner installation',
        hi: 'एयर कंडीशनर इंस्टालेशन',
      },
      basePrice: 799,
    },
    {
      nameTranslations: {
        en: 'Ac service',
        hi: 'एसी सर्विस',
      },
      descriptionTranslations: {
        en: 'Air conditioner servicing',
        hi: 'एयर कंडीशनर सर्विसिंग',
      },
      basePrice: 599,
    },
    {
      nameTranslations: {
        en: 'Ac repair',
        hi: 'एसी मरम्मत',
      },
      descriptionTranslations: {
        en: 'Air conditioner repair',
        hi: 'एयर कंडीशनर मरम्मत',
      },
      basePrice: 699,
    },
    {
      nameTranslations: {
        en: 'Ac gas refill',
        hi: 'एसी गैस रिफिल',
      },
      descriptionTranslations: {
        en: 'AC gas refill and charging',
        hi: 'एसी गैस रिफिल और चार्जिंग',
      },
      basePrice: 899,
    },
    {
      nameTranslations: {
        en: 'Fridge repair',
        hi: 'फ्रिज मरम्मत',
      },
      descriptionTranslations: {
        en: 'Refrigerator repair',
        hi: 'रेफ्रिजरेटर मरम्मत',
      },
      basePrice: 599,
    },
    {
      nameTranslations: {
        en: 'Socket installation/Installation',
        hi: 'सॉकेट इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'Electrical socket installation',
        hi: 'इलेक्ट्रिकल सॉकेट इंस्टालेशन',
      },
      basePrice: 149,
    },
    {
      nameTranslations: {
        en: 'Switch repair/Installation',
        hi: 'स्विच मरम्मत/इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'Switch repair and installation',
        hi: 'स्विच मरम्मत और इंस्टालेशन',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'Mcb repair/instalation',
        hi: 'एमसीबी मरम्मत/इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'MCB repair and installation',
        hi: 'एमसीबी मरम्मत और इंस्टालेशन',
      },
      basePrice: 299,
    },
    {
      nameTranslations: {
        en: 'Oven repair',
        hi: 'ओवन मरम्मत',
      },
      descriptionTranslations: {
        en: 'Oven repair and maintenance',
        hi: 'ओवन मरम्मत और रखरखाव',
      },
      basePrice: 449,
    },
    {
      nameTranslations: {
        en: 'Iron repair',
        hi: 'इस्त्री मरम्मत',
      },
      descriptionTranslations: {
        en: 'Iron repair and maintenance',
        hi: 'इस्त्री मरम्मत और रखरखाव',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'Other Electrician services (Hourly basis)',
        hi: 'अन्य इलेक्ट्रीशियन सेवाएं (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Other electrician services on hourly basis',
        hi: 'प्रति घंटा आधार पर अन्य इलेक्ट्रीशियन सेवाएं',
      },
      basePrice: 349,
    },
  ];

  for (const service of electricalServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: repairAndFixtures.id,
        subcategoryId: electrical.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        status: 'ACTIVE',
      },
    });
    console.log(`    └── ✅ Created service: ${service.nameTranslations.en}`);
  }

  // ---------------------------------------------------------
  // 3. GENERAL HOME SERVICES
  // ---------------------------------------------------------

  const generalHomeServices = await prisma.category.create({
    data: {
      nameTranslations: {
        en: 'General Home Services',
        hi: 'सामान्य घरेलू सेवाएं',
      },
      slug: 'general-home-services',
      iconUrl:
        'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723232/labour_lrajer.png',
      order: 3,
    },
  });

  console.log('✅ Created category: General Home Services');

  // ---------------------------------------------------------
  // GENERAL HOME SERVICES SERVICES
  // ---------------------------------------------------------

  const generalServices = [
    {
      nameTranslations: {
        en: 'Gardening (Hourly basis)',
        hi: 'बागवानी (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Professional gardening services on hourly basis',
        hi: 'प्रति घंटा आधार पर पेशेवर बागवानी सेवाएं',
      },
      basePrice: 399,
    },
    {
      nameTranslations: {
        en: 'Car wash',
        hi: 'कार धोना',
      },
      descriptionTranslations: {
        en: 'Complete car washing service',
        hi: 'पूर्ण कार धोने की सेवा',
      },
      basePrice: 499,
    },
    {
      nameTranslations: {
        en: 'Two wheeler wash',
        hi: 'दोपहिया वाहन धोना',
      },
      descriptionTranslations: {
        en: 'Two wheeler washing service',
        hi: 'दोपहिया वाहन धोने की सेवा',
      },
      basePrice: 199,
    },
    {
      nameTranslations: {
        en: 'General home Assistance (Hourly)',
        hi: 'सामान्य घरेलू सहायता (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'General home assistance on hourly basis',
        hi: 'प्रति घंटा आधार पर सामान्य घरेलू सहायता',
      },
      basePrice: 299,
    },
    {
      nameTranslations: {
        en: 'Water tank cleaning',
        hi: 'पानी की टंकी सफाई',
      },
      descriptionTranslations: {
        en: 'Water tank cleaning and maintenance',
        hi: 'पानी की टंकी सफाई और रखरखाव',
      },
      basePrice: 799,
    },
  ];

  for (const service of generalServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: generalHomeServices.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        status: 'ACTIVE',
      },
    });
    console.log(`  └── ✅ Created service: ${service.nameTranslations.en}`);
  }

  // ---------------------------------------------------------
  // 4. HOME REPAIR AND RENOVATIONS
  // ---------------------------------------------------------

  const homeRepairRenovation = await prisma.category.create({
    data: {
      nameTranslations: {
        en: 'Home Repair and Renovations',
        hi: 'घर की मरम्मत और नवीनीकरण',
      },
      slug: 'home-repair-and-renovations',
      iconUrl:
        'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779723272/painting_xqchmr.png',
      order: 4,
    },
  });

  console.log('✅ Created category: Home Repair and Renovations');

  // ---------------------------------------------------------
  // HOME REPAIR AND RENOVATIONS SERVICES
  // ---------------------------------------------------------

  const repairServices = [
    {
      nameTranslations: {
        en: 'Painter (Hourly basis)',
        hi: 'पेंटर (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Professional painting services on hourly basis',
        hi: 'प्रति घंटा आधार पर पेशेवर पेंटिंग सेवाएं',
      },
      basePrice: 449,
    },
    {
      nameTranslations: {
        en: 'Carpenter (Hourly basis)',
        hi: 'बढ़ई (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Professional carpentry services on hourly basis',
        hi: 'प्रति घंटा आधार पर पेशेवर बढ़ई सेवाएं',
      },
      basePrice: 399,
    },
    {
      nameTranslations: {
        en: 'Mistri (Mason) (Hourly basis)',
        hi: 'मिस्त्री (राजमिस्त्री) (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Professional masonry services on hourly basis',
        hi: 'प्रति घंटा आधार पर पेशेवर राजमिस्त्री सेवाएं',
      },
      basePrice: 449,
    },
    {
      nameTranslations: {
        en: 'Pest control',
        hi: 'कीट नियंत्रण',
      },
      descriptionTranslations: {
        en: 'Complete pest control and fumigation services',
        hi: 'पूर्ण कीट नियंत्रण और फ्यूमीगेशन सेवाएं',
      },
      basePrice: 899,
    },
    {
      nameTranslations: {
        en: 'General Labour (Hourly basis)',
        hi: 'सामान्य श्रमिक (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'General labor services on hourly basis',
        hi: 'प्रति घंटा आधार पर सामान्य श्रमिक सेवाएं',
      },
      basePrice: 299,
    },
  ];

  for (const service of repairServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: homeRepairRenovation.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        status: 'ACTIVE',
      },
    });
    console.log(`  └── ✅ Created service: ${service.nameTranslations.en}`);
  }

  // ---------------------------------------------------------
  // 5. BABYSITTING AND ELDER CARE
  // ---------------------------------------------------------

  const babysittingElderCare = await prisma.category.create({
    data: {
      nameTranslations: {
        en: 'Babysitting and Elder Care',
        hi: 'बेबीसिटिंग और बुजुर्गों की देखभाल',
      },
      slug: 'babysitting-and-elder-care',
      iconUrl:
        'https://res.cloudinary.com/dchtlnkhn/image/upload/q_auto/f_auto/v1779722804/cleaning-img_e0asab.png',
      order: 5,
    },
  });

  console.log('✅ Created category: Babysitting and Elder Care');

  // ---------------------------------------------------------
  // BABYSITTING AND ELDER CARE SERVICES
  // ---------------------------------------------------------

  const careServices = [
    {
      nameTranslations: {
        en: 'Baby sitting (Hourly)',
        hi: 'बेबीसिटिंग (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Professional babysitting services on hourly basis',
        hi: 'प्रति घंटा आधार पर पेशेवर बेबीसिटिंग सेवाएं',
      },
      basePrice: 349,
    },
    {
      nameTranslations: {
        en: 'Elders care (Hourly)',
        hi: 'बुजुर्गों की देखभाल (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Elderly care services on hourly basis',
        hi: 'प्रति घंटा आधार पर बुजुर्गों की देखभाल सेवाएं',
      },
      basePrice: 399,
    },
    {
      nameTranslations: {
        en: 'Patient care by certified nurse (Hourly)',
        hi: 'प्रमाणित नर्स द्वारा रोगी देखभाल (प्रति घंटा)',
      },
      descriptionTranslations: {
        en: 'Professional patient care by certified nurses',
        hi: 'प्रमाणित नर्स द्वारा पेशेवर रोगी देखभाल',
      },
      basePrice: 599,
    },
  ];

  for (const service of careServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: babysittingElderCare.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        status: 'ACTIVE',
      },
    });
    console.log(`  └── ✅ Created service: ${service.nameTranslations.en}`);
  }

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------

  console.log('\n========================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY');
  console.log('========================================');

  console.log('\nCategories created:');
  console.log('1. Daily Home Help (14 services)');
  console.log('2. Repair and Fixtures');
  console.log('   ├── Plumbing (7 services)');
  console.log('   └── Electrical (17 services)');
  console.log('3. General Home Services (5 services)');
  console.log('4. Home Repair and Renovations (5 services)');
  console.log('5. Babysitting and Elder Care (3 services)');

  console.log('\nSubcategories created: 2');
  console.log('Services created: 51');
  console.log('Categories created: 5');
  console.log('========================================');
}

// ---------------------------------------------------------
// EXECUTE SEED
// ---------------------------------------------------------

main()
  .catch((error) => {
    console.error('❌ Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
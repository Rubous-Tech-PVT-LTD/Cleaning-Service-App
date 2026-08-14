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
  // CLEAR EXISTING DATA IN CORRECT ORDER (respecting foreign keys)
  // ---------------------------------------------------------

  console.log('🧹 Clearing existing messages...');
  await (prisma as any).message.deleteMany();

  console.log('🧹 Clearing existing chats...');
  await (prisma as any).chat.deleteMany();

  console.log('🧹 Clearing existing reviews...');
  await (prisma as any).review.deleteMany();

  console.log('🧹 Clearing existing bookings...');
  await prisma.booking.deleteMany();

  console.log('🧹 Clearing existing cart items...');
  await (prisma as any).cartItem.deleteMany();

  console.log('🧹 Clearing existing carts...');
  await prisma.cart.deleteMany();

  console.log('🧹 Clearing existing services...');
  await prisma.service.deleteMany();

  console.log('🧹 Clearing existing subcategories...');
  await (prisma as any).subcategory.deleteMany();

  console.log('🧹 Clearing existing categories...');
  await prisma.category.deleteMany();

  // ---------------------------------------------------------
  // HOURLY SERVICE (Special service for hourly bookings)
  // ---------------------------------------------------------

  const hourlyServiceCategory = await prisma.category.create({
    data: {
      nameTranslations: {
        en: 'Hourly Services',
        hi: 'प्रति घंटा सेवाएं',
      },
      slug: 'hourly-services',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3532/3532696.png',
      order: 100,
    },
  });

  const hourlyService = await prisma.service.create({
    data: {
      id: 'hourly-service', // Fixed ID for cart system
      categoryId: hourlyServiceCategory.id,
      nameTranslations: {
        en: 'Hourly Service',
        hi: 'प्रति घंटा सेवा',
      },
      descriptionTranslations: {
        en: 'Professional hourly-based services for your home needs',
        hi: 'आपकी घरेलू जरूरतों के लिए पेशेवर प्रति घंटा सेवाएं',
      },
      basePrice: 0, // Price determined by duration selection
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3532/3532696.png',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Hourly Service with ID:', hourlyService.id);

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
      nameTranslations: { en: 'Bathroom', hi: 'बाथरूम' },
      descriptionTranslations: { en: 'Professional bathroom cleaning service', hi: 'पेशेवर बाथरूम सफाई सेवा' },
      basePrice: 299,
      estimatedTime: '40 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431895/female-bathroom-cleaner_pmjtqt.png'
    },
    {
      nameTranslations: { en: 'Kitchen cleaning', hi: 'रसोईघर सफाई' },
      descriptionTranslations: { en: 'Complete kitchen cleaning and sanitization', hi: 'पूर्ण रसोईघर सफाई और सेनिटाइजेशन' },
      basePrice: 399,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431896/female-deep-cleaner_duj2fg.png'
    },
    {
      nameTranslations: { en: 'Cooking', hi: 'खाना बनाना' },
      descriptionTranslations: { en: 'Home cooking service', hi: 'घरेलू खाना बनाने की सेवा' },
      basePrice: 499,
      estimatedTime: '60 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786685470/Gemini_Generated_Image_rgmpdhrgmpdhrgmp_swccun.png'
    },
    {
      nameTranslations: { en: 'Dishes', hi: 'बर्तन' },
      descriptionTranslations: { en: 'Dishwashing service', hi: 'बर्तन धोने की सेवा' },
      basePrice: 199,
      estimatedTime: '20 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786686012/Dishes_hidrmu.png'
    },
    {
      nameTranslations: { en: 'Mopping and sweeping', hi: 'पोंछा और झाड़ू' },
      descriptionTranslations: { en: 'Floor mopping and sweeping', hi: 'फर्श पोंछा और झाड़ू' },
      basePrice: 249,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786685842/Mopping_and_Sweeping_ixrtic.png'
    },
    {
      nameTranslations: { en: 'Dusting and wiping', hi: 'धूल और पोंछा' },
      descriptionTranslations: { en: 'Dusting and surface wiping', hi: 'धूल और सतह पोंछा' },
      basePrice: 199,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786686627/dusting_and_wiping_rvmqf9.png'
    },
    {
      nameTranslations: { en: 'Laundry', hi: 'कपड़े धोना' },
      descriptionTranslations: { en: 'Clothes washing service', hi: 'कपड़े धोने की सेवा' },
      basePrice: 599,
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786686222/Laundry_ld23a0.png'
    },
    {
      nameTranslations: { en: 'Ironing', hi: 'इस्त्री' },
      descriptionTranslations: { en: 'Clothes ironing service', hi: 'कपड़े इस्त्री की सेवा' },
      basePrice: 399,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786686750/ironing_2_vutyij.png'
    },
    {
      nameTranslations: { en: 'Complete bedroom cleaning', hi: 'पूर्ण बेडरूम सफाई' },
      descriptionTranslations: { en: 'Complete bedroom cleaning service', hi: 'पूर्ण बेडरूम सफाई सेवा' },
      basePrice: 699,
      estimatedTime: '60 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431900/female-home-cleaner_cxyy6w.png'
    },
    {
      nameTranslations: { en: 'Fan cleaning', hi: 'पंखा सफाई' },
      descriptionTranslations: { en: 'Ceiling fan cleaning', hi: 'पंखा सफाई' },
      basePrice: 149,
      estimatedTime: '20 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786687061/fan_cleaning_hq5qkn.png'
    },
    {
      nameTranslations: { en: 'Fridge cleaning', hi: 'फ्रिज सफाई' },
      descriptionTranslations: { en: 'Refrigerator cleaning service', hi: 'रेफ्रिजरेटर सफाई सेवा' },
      basePrice: 449,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786687212/fridge_cleaning_m9crkb.png'
    },
    {
      nameTranslations: { en: 'Terrace/ Verandah cleaning', hi: 'छत/बरामदा सफाई' },
      descriptionTranslations: { en: 'Terrace and verandah cleaning', hi: 'छत और बरामदा सफाई' },
      basePrice: 799,
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786687058/Terrace_and_verandah_o2d8ll.png'
    },
    {
      nameTranslations: { en: 'Sofa cleaning', hi: 'सोफा सफाई' },
      descriptionTranslations: { en: 'Sofa deep cleaning service', hi: 'सोफा गहरी सफाई सेवा' },
      basePrice: 899,
      estimatedTime: '60 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431898/male-sofa-cleaner_h3vrwz.png'
    },
    {
      nameTranslations: { en: 'Carpet cleaning', hi: 'कालीन सफाई' },
      descriptionTranslations: { en: 'Carpet and rug cleaning', hi: 'कालीन और गलीचा सफाई' },
      basePrice: 599,
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431892/female-carpet-cleaner_u4teld.png'
    },
  ];

  for (const service of services) {
    await (prisma as any).service.create({
      data: {
        categoryId: dailyHomeHelp.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        estimatedTime: service.estimatedTime,
        imageUrl: service.imageUrl || null,
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
        'https://res.cloudinary.com/dcmoseix9/image/upload/v1786699900/plumber_bmjvri.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431904/tap-repair_cmbhfy.png'
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786688409/shower_repair_hypk9y.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786688708/motor_repair_j6gulm.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431901/pipeline-leakage_qvxhf4.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786688921/Toilet_flush_repair_lymqzt.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689145/jet_spray_repair_xcgekk.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689310/other_plumbing_service_xwdorb.png',
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
        imageUrl: service.imageUrl || null,
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431891/light-installation_jiemgi.png',
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
      imageUrl:'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431904/wiring-issues_otsci3.png'
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431890/fan-installation_innz8k.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786688222/Fan_repair_txvyuw.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689541/washing_machine_repair_txrviy.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689494/washing_Machine_installation_yvtbx4.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689661/Ac_install_jls1ne.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690000/Ac_service_yhdb9f.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689806/Ac_repair_yshgdz.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690075/Ac_gas_refill_bwrdbh.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690248/fridge_repair_bu7fsn.png',
    },
    {
      nameTranslations: {
        en: 'Socket repair/Installation',
        hi: 'सॉकेट इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'Electrical socket installation',
        hi: 'इलेक्ट्रिकल सॉकेट इंस्टालेशन',
      },
      basePrice: 149,
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690343/socket_repai_aec63c.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431904/switch-repair_h38eku.png',
    },
    {
      nameTranslations: {
        en: 'Mcb repair/installation',
        hi: 'एमसीबी मरम्मत/इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'MCB repair and installation',
        hi: 'एमसीबी मरम्मत और इंस्टालेशन',
      },
      basePrice: 299,
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690477/mcb_repair_hkieuz.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690655/oven_repair_db0zgb.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690739/Iron_repair_pqhf8k.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691206/Other_electrical_oe6fds.png',
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
        imageUrl: service.imageUrl || null,
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
        'https://res.cloudinary.com/dcmoseix9/image/upload/v1786700246/GeneralHomeService_hv6apo.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691541/gardening_voitqg.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691769/car_wash_htmjxd.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691825/two_wheeler_wash_marazh.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691873/Home_assistance_rutn95.png',
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
       imageUrl:'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692040/water_tank_cleaning_ir8u0g.png'
    },
  ];

  for (const service of generalServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: generalHomeServices.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        imageUrl: service.imageUrl || null,
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
        'https://res.cloudinary.com/dcmoseix9/image/upload/v1786699156/home_repair_tifimy.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431905/painting_mef64a.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692559/Carpenter_pudiv6.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431900/minor-renovation_hwc98l.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692511/pest_control_fcpk6p.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431895/labour_ykt5a8.png',
    },
  ];

  for (const service of repairServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: homeRepairRenovation.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        imageUrl: service.imageUrl || null,
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
        'https://res.cloudinary.com/dcmoseix9/image/upload/v1786699597/BabySitting_sqcqmr.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692801/baby_sitting_ltl9x6.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692784/elders_care_xl5elp.png',
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
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692913/patient_care_mazaf1.png',
    },
  ];

  for (const service of careServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: babysittingElderCare.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        imageUrl: service.imageUrl || null,
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

  // ---------------------------------------------------------
  // SUPPORTED SERVICE CITIES
  // ---------------------------------------------------------

  console.log('🌍 Seeding supported cities...');
  await prisma.supportedCity.deleteMany();

  const supportedCities = [
    {
      name: 'Delhi NCR',
      slug: 'delhi-ncr',
      aliases: ['Delhi', 'New Delhi', 'Noida', 'Gurugram', 'Gurgaon', 'Ghaziabad', 'Faridabad'],
      latitude: 28.6139,
      longitude: 77.209,
      radiusKm: 60,
      isActive: true,
      order: 1,
    },
    {
      name: 'Mumbai',
      slug: 'mumbai',
      aliases: ['Bombay', 'Navi Mumbai', 'Thane'],
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 50,
      isActive: true,
      order: 2,
    },
    {
      name: 'Bangalore',
      slug: 'bangalore',
      aliases: ['Bengaluru', 'Bangalore Urban'],
      latitude: 12.9716,
      longitude: 77.5946,
      radiusKm: 45,
      isActive: true,
      order: 3,
    },
  ];

  for (const city of supportedCities) {
    await prisma.supportedCity.create({ data: city });
    console.log(`✅ Supported city: ${city.name}`);
  }

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
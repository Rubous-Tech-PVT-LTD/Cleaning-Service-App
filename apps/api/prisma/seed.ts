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
      basePrice: 149,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431895/female-bathroom-cleaner_pmjtqt.png',
      includedItems: [
      { en: 'Toilet seat cleaning', hi: 'टॉयलेट सीट की सफाई' },
{ en: 'WC cleaning', hi: 'WC की सफाई' },
{ en: 'Wash basin cleaning', hi: 'वॉश बेसिन की सफाई' },
{ en: 'Mirror cleaning', hi: 'शीशे की सफाई' },
{ en: 'Floor wiping/scrubbing', hi: 'फर्श की सफाई और रगड़ाई' },
{ en: 'Wet waste bin emptying', hi: 'गीले कचरे का डिब्बा खाली करना' },
{
  en: "Cleaning is carried out using the customer's cleaning liquid and tools.",
  hi: 'सफाई ग्राहक के क्लीनिंग लिक्विड और उपकरणों का उपयोग करके की जाती है।'
},
      ],
      notIncludedItems: [
       { en: 'Company-supplied cleaning chemicals', hi: 'कंपनी द्वारा दिए गए क्लीनिंग केमिकल्स' },
{ en: 'Hard-water and scale stain removal', hi: 'हार्ड-वॉटर और जमी हुई परत के दाग की सफाई' },
{ en: 'Exhaust fan deep cleaning', hi: 'एग्जॉस्ट फैन की गहरी सफाई' },
{ en: 'Geyser deep cleaning', hi: 'गीजर की गहरी सफाई' },
{ en: 'Wall-tile deep scrubbing', hi: 'दीवार की टाइलों की गहरी सफाई' },
{ en: 'More than 1 bathroom requires a separate booking', hi: '1 से अधिक बाथरूम के लिए अलग बुकिंग करनी होगी' },
      ]
    },
    {
      nameTranslations: { en: 'Kitchen cleaning', hi: 'रसोईघर सफाई' },
      descriptionTranslations: { en: 'Complete kitchen cleaning and sanitization', hi: 'पूर्ण रसोईघर सफाई और सेनिटाइजेशन' },
      basePrice: 125,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431896/female-deep-cleaner_duj2fg.png',
      includedItems: [
       { en: 'Platform/countertop wiping', hi: 'प्लेटफॉर्म/काउंटरटॉप की सफाई' },
{ en: 'Sink cleaning', hi: 'सिंक की सफाई' },
{ en: 'Stove exterior cleaning', hi: 'स्टोव के बाहरी हिस्से की सफाई' },
{ en: 'Backsplash wiping', hi: 'बैकस्प्लैश की सफाई' },
{ en: 'Visible countertop clutter tidying', hi: 'काउंटरटॉप पर दिखाई देने वाली चीज़ों को व्यवस्थित करना' },
{ en: "Cleaning is done using the customer's cloth and cleaning liquid.", hi: 'सफाई ग्राहक के कपड़े और क्लीनिंग लिक्विड का उपयोग करके की जाती है।' },
      ],
      notIncludedItems: [
 { en: 'Company-supplied cleaning chemicals', hi: 'कंपनी द्वारा दिए गए क्लीनिंग केमिकल्स' },
{ en: 'Chimney and exhaust degreasing', hi: 'चिमनी और एग्जॉस्ट की ग्रीस की सफाई' },
{ en: 'Inside-cabinet cleaning', hi: 'कैबिनेट के अंदर की सफाई' },
{ en: 'Fridge cleaning', hi: 'फ्रिज की सफाई' },
{ en: 'Utensil washing requires a separate Dishes booking', hi: 'बर्तन धोने के लिए अलग से डिशेज़ की बुकिंग करनी होगी' },
      ]
    },
    {
      nameTranslations: { en: 'Kitchen Preps', hi: 'रसोईघर सफाई' },
      descriptionTranslations: { en: 'Complete kitchen cleaning and sanitization', hi: 'पूर्ण रसोईघर सफाई और सेनिटाइजेशन' },
      basePrice: 149,
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786685470/Gemini_Generated_Image_rgmpdhrgmpdhrgmp_swccun.png',
      includedItems: [
     { en: 'Vegetable washing', hi: 'सब्जियों को धोना' },
{ en: 'Vegetable chopping and cutting', hi: 'सब्जियों को काटना और टुकड़े करना' },
{ en: 'Vegetable sorting', hi: 'सब्जियों को छांटना' },
{ en: 'Vegetable storage', hi: 'सब्जियों को व्यवस्थित करके रखना' },
      ],
      notIncludedItems: [
{ en: 'Grocery shopping or grocery cost', hi: 'किराने की खरीदारी या किराने का खर्च' },
{ en: 'Non-veg or specialty dishes', hi: 'नॉन-वेज या विशेष व्यंजन' },
{ en: 'Dessert preparation', hi: 'मिठाई बनाना' },
{ en: 'Kitchen or utensil clean-up after cooking', hi: 'खाना बनाने के बाद रसोई या बर्तनों की सफाई' },
{ en: 'Kitchen preparation (vegetable washing, cutting, etc.)', hi: 'रसोई की तैयारी (सब्जियां धोना, काटना आदि)' },
{ en: 'Utensil clean-up requires a separate Dishes booking', hi: 'बर्तनों की सफाई के लिए अलग से डिशेज़ की बुकिंग करनी होगी' },
      ]
    },
    {
      nameTranslations: { en: 'Cooking (Upto 6 people)', hi: 'खाना बनाना' },
      descriptionTranslations: { en: 'Home cooking service', hi: 'घरेलू खाना बनाने की सेवा' },
      basePrice: 249,
      estimatedTime: '60 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1788166631/cooking_reqdng.png',
      includedItems: [
        { en: '1 dal or sabzi', hi: '1 दाल या सब्जी' },
{ en: 'Rice or roti preparation', hi: 'चावल या रोटी बनाना' },
{ en: 'Cooking for up to 6 people', hi: 'अधिकतम 6 लोगों के लिए खाना बनाना' },
{ en: "Cooking with customer's groceries", hi: 'ग्राहक की किराने की सामग्री से खाना बनाना' },
{ en: "Cooking in customer's kitchen", hi: 'ग्राहक की रसोई में खाना बनाना' },
{ en: 'Basic seasoning', hi: 'सामान्य मसाले का उपयोग' },
      ],
      notIncludedItems: [
        { en: 'Grocery shopping or grocery cost', hi: 'किराने की खरीदारी या किराने का खर्च' },
{ en: 'Non-veg or specialty dishes', hi: 'नॉन-वेज या विशेष व्यंजन' },
{ en: 'Dessert preparation', hi: 'मिठाई बनाना' },
{ en: 'Kitchen or utensil clean-up after cooking', hi: 'खाना बनाने के बाद रसोई या बर्तनों की सफाई' },
{ en: 'Kitchen preparation (vegetable cutting, etc.)', hi: 'रसोई की तैयारी (सब्जियां काटना आदि)' },
{ en: 'Utensil clean-up requires a separate Dishes booking', hi: 'बर्तनों की सफाई के लिए अलग से डिशेज़ की बुकिंग करनी होगी' },
      ]
    },
    {
      nameTranslations: { en: 'Dishes', hi: 'बर्तन' },
      descriptionTranslations: { en: 'Dishwashing service', hi: 'बर्तन धोने की सेवा' },
      basePrice: 99,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786686012/Dishes_hidrmu.png',
      includedItems: [
       { en: 'Standard daily utensil washing', hi: 'रोज़ाना के सामान्य बर्तनों की सफाई' },
{ en: "Utensils washed using customer's dishwashing liquid", hi: 'ग्राहक के डिशवॉशिंग लिक्विड से बर्तन धोना' },
{ en: 'Utensils rinsed and stacked to dry', hi: 'बर्तनों को पानी से धोकर सुखाने के लिए रखना' },
      ],
      notIncludedItems: [
       { en: 'Company-supplied cleaning liquid or sanitizer', hi: 'कंपनी द्वारा दिया गया क्लीनिंग लिक्विड या सैनिटाइज़र' },
{ en: 'Heavily burnt or soak-required vessels beyond the service time', hi: 'बहुत अधिक जले हुए या भिगोने की आवश्यकता वाले बर्तन, जिनमें निर्धारित समय से अधिक समय लगे' },
{ en: 'Party-size utensil loads', hi: 'पार्टी में उपयोग होने वाले अधिक मात्रा के बर्तन' },
      ]
    },
    {
      nameTranslations: { en: 'Mopping and sweeping', hi: 'पोंछा और झाड़ू' },
      descriptionTranslations: { en: 'Floor mopping and sweeping', hi: 'फर्श पोंछा और झाड़ू' },
      basePrice: 125,
      estimatedTime: '25 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786685842/Mopping_and_Sweeping_ixrtic.png',
      includedItems: [
        { en: 'Sweeping of all floor areas', hi: 'सभी फर्श की सफाई और झाड़ू लगाना' },
{ en: 'Wet mopping of all floor areas', hi: 'सभी फर्श की गीले पोछे से सफाई' },
{ en: 'Coverage up to 2BHK', hi: '2BHK तक के क्षेत्र के लिए' },
{ en: "Using customer's mop and detergent", hi: 'ग्राहक के पोछे और डिटर्जेंट का उपयोग' },
      ],
      notIncludedItems: [
       { en: 'Company-supplied detergent', hi: 'कंपनी द्वारा दिया गया डिटर्जेंट' },
{ en: 'Furniture shifting for under-bed/sofa mopping', hi: 'बिस्तर/सोफे के नीचे पोछा लगाने के लिए फर्नीचर हटाना' },
{ en: 'Balcony and terrace cleaning', hi: 'बालकनी और छत की सफाई' },
{ en: 'Stain removal', hi: 'दाग की सफाई' },
      ]
    },
    {
      nameTranslations: { en: 'Dusting and wiping', hi: 'धूल और पोंछा' },
      descriptionTranslations: { en: 'Dusting and surface wiping', hi: 'धूल और सतह पोंछा' },
      basePrice: 125,
      estimatedTime: '25 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786686627/dusting_and_wiping_rvmqf9.png',
      includedItems: [
       { en: 'Furniture tops dusting', hi: 'फर्नीचर की ऊपरी सतह की धूल साफ करना' },
{ en: 'Shelf dusting', hi: 'शेल्फ की धूल साफ करना' },
{ en: 'TV unit dusting', hi: 'टीवी यूनिट की धूल साफ करना' },
{ en: 'Window sill dusting', hi: 'खिड़की की सिल की धूल साफ करना' },
{ en: "Using customer's duster or cloth", hi: 'ग्राहक के डस्टर या कपड़े का उपयोग' },
      ],
      notIncludedItems: [
       { en: 'Company-supplied cleaning materials', hi: 'कंपनी द्वारा दिए गए क्लीनिंग सामग्री' },
{ en: 'Fan, AC and chandelier dusting', hi: 'पंखे, AC और झूमर की धूल साफ करना' },
{ en: 'Wall and ceiling cobweb removal', hi: 'दीवार और छत से मकड़ी के जाले हटाना' },
{ en: 'Upholstery cleaning', hi: 'फर्नीचर के कपड़े की सफाई' },
      ]
    },
     {
  nameTranslations: { en: 'Laundry', hi: 'कपड़े धोना' },
  descriptionTranslations: {
    en: 'Washing, drying and basic folding of clothes',
    hi: 'कपड़ों की धुलाई, सुखाना और सामान्य तह करना'
  },
  basePrice: 199,
  estimatedTime: '60 mins',
  imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786686222/Laundry_ld23a0.png',
  includedItems: [
  {
    en: "Washing 1 machine load in customer's washing machine",
    hi: 'ग्राहक की वॉशिंग मशीन में 1 मशीन लोड कपड़े धोना'
  },
  {
    en: "Using customer's detergent",
    hi: 'ग्राहक के डिटर्जेंट का उपयोग'
  },
  {
    en: 'Hanging washed clothes for drying',
    hi: 'धुले हुए कपड़ों को सुखाने के लिए टांगना'
  },
  {
    en: 'Laundry area cleaning',
    hi: 'लॉन्ड्री क्षेत्र की सफाई'
  }
],
 notIncludedItems: [
  {
    en: 'Company-supplied detergent',
    hi: 'कंपनी द्वारा दिया गया डिटर्जेंट'
  },
  {
    en: 'Drying and folding',
    hi: 'कपड़ों को सुखाना और तह करना'
  },
  {
    en: 'Stain treatment',
    hi: 'दाग हटाने का उपचार'
  },
  {
    en: 'Hand-wash-only or dry-clean-only garments',
    hi: 'केवल हाथ से धोने वाले या केवल ड्राई-क्लीन वाले कपड़े'
  }
]
     },
    {
      nameTranslations: { en: 'Complete Wardrobe Cleaning', hi: 'पूरी अलमारी की सफाई' },
      descriptionTranslations: { en: 'Complete wardrobe cleaning service', hi: 'पूरी अलमारी की सफाई की सेवा' },
      basePrice: 399,
      estimatedTime: '120 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1788168965/wardrobe_gbdjzm.png',
      includedItems: [
        { en: 'Exterior wardrobe cleaning', hi: 'अलमारी के बाहरी हिस्से की सफाई' },
        { en: 'Interior shelf and rack cleaning', hi: 'अलमारी के अंदर शेल्फ और रैक की सफाई' },
        { en: 'Dust removal from visible surfaces', hi: 'दिखाई देने वाली सतहों से धूल साफ करना' },
        { en: 'Contents temporarily removed and replaced', hi: 'सामान को थोड़ी देर के लिए हटाकर वापस रखना' },
        { en: 'Basic organization of wardrobe contents', hi: 'अलमारी के सामान को सामान्य रूप से व्यवस्थित करना' },
      ],
      notIncludedItems: [
        { en: 'Company-supplied cleaning materials', hi: 'कंपनी द्वारा दी गई क्लीनिंग सामग्री' },
        { en: 'Deep cleaning of wardrobe interiors', hi: 'अलमारी के अंदर की गहरी सफाई' },
        { en: 'Pest or termite treatment', hi: 'कीट या दीमक का उपचार' },
        { en: 'Repair or replacement of wardrobe parts', hi: 'अलमारी के हिस्सों की मरम्मत या बदलना' },
      ]
    },
    {
      nameTranslations: { en: 'Ironing', hi: 'इस्त्री' },
      descriptionTranslations: { en: 'Clothes ironing service', hi: 'कपड़े इस्त्री की सेवा' },
      basePrice: 125,
      estimatedTime: '30 mins (12-15 garments)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786686750/ironing_2_vutyij.png',
      includedItems: [
        { en: 'Ironing 12-15 garments', hi: '12-15 कपड़े इस्त्री करना' },
        { en: "Regular ironing using customer's iron and ironing board", hi: 'ग्राहक की इस्त्री और इस्त्री बोर्ड का उपयोग करके सामान्य कपड़ों की इस्त्री' },
      ],
      notIncludedItems: [
        { en: 'Company-supplied iron or starch spray', hi: 'कंपनी द्वारा दी गई इस्त्री या स्टार्च स्प्रे' },
        { en: 'Delicate or silk specialist pressing', hi: 'नाज़ुक या रेशमी कपड़ों की विशेष इस्त्री' },
        { en: 'Folding beyond simple stacking', hi: 'सिर्फ एक के ऊपर एक रखने के अलावा कपड़ों की तह करना' },
        { en: 'More than 15 garments (additional charges apply)', hi: '15 से अधिक कपड़ों पर अतिरिक्त शुल्क लागू होगा' },
      ]
    },
    {
      nameTranslations: { en: 'Complete bedroom cleaning', hi: 'पूर्ण बेडरूम सफाई' },
      descriptionTranslations: { en: 'Complete bedroom cleaning service', hi: 'पूर्ण बेडरूम सफाई सेवा' },
      basePrice: 249,
      estimatedTime: '40 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431900/female-home-cleaner_cxyy6w.png',
      isTrending: true,
      includedItems: [
      { en: 'Dusting', hi: 'धूल साफ करना' },
{ en: 'Floor sweeping and mopping', hi: 'फर्श पर झाड़ू और पोछा लगाना' },
{ en: 'Bed making and linen change', hi: 'बिस्तर लगाना और चादर बदलना' },
{ en: 'Surface wipe-down', hi: 'सतहों की सफाई' },
{ en: 'Coverage for 1 bedroom', hi: '1 बेडरूम तक की सफाई' },
{ en: "Using customer's cleaning materials", hi: 'ग्राहक की क्लीनिंग सामग्री का उपयोग' },
      ],
      notIncludedItems: [
        { en: 'Company-supplied cleaning materials', hi: 'कंपनी द्वारा दी गई क्लीनिंग सामग्री' },
{ en: 'Wardrobe interior organizing', hi: 'अलमारी के अंदर सामान व्यवस्थित करना' },
{ en: 'Mattress and upholstery cleaning', hi: 'गद्दे और फर्नीचर के कपड़े की सफाई' },
{ en: 'Curtain cleaning', hi: 'पर्दों की सफाई' },
      ]
    },
    {
      nameTranslations: { en: 'Fan cleaning', hi: 'पंखा सफाई' },
      descriptionTranslations: { en: 'Ceiling fan cleaning', hi: 'पंखा सफाई' },
      basePrice: 90,
      estimatedTime: '15 mins (per fan)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786687061/fan_cleaning_hq5qkn.png',
      includedItems: [
        { en: "Fan blades wiped using customer's cloth/duster", hi: 'ग्राहक के कपड़े/डस्टर से पंखे के ब्लेड साफ करना' },
{ en: "Fan motor body wiped using customer's cloth/duster", hi: 'ग्राहक के कपड़े/डस्टर से पंखे के मोटर की सफाई' },
{ en: 'Dust caught below with cloth or newspaper', hi: 'नीचे गिरने वाली धूल को कपड़े या अखबार से इकट्ठा करना' },
      ],
      notIncludedItems: [
        { en: 'Company-supplied cleaning materials', hi: 'कंपनी द्वारा दी गई क्लीनिंग सामग्री' },
{ en: 'Fan blade removal and washing', hi: 'पंखे के ब्लेड निकालकर धोना' },
{ en: 'More than 1 fan (additional charges apply)', hi: '1 से अधिक पंखे पर अतिरिक्त शुल्क लागू होगा' },
{ en: 'Electrical inspection', hi: 'इलेक्ट्रिकल जांच' },
      ]
    },
    {
      nameTranslations: { en: 'Fridge cleaning', hi: 'फ्रिज सफाई' },
      descriptionTranslations: { en: 'Refrigerator cleaning service', hi: 'रेफ्रिजरेटर सफाई सेवा' },
      basePrice: 199,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786687212/fridge_cleaning_m9crkb.png',
      includedItems: [
       { en: 'Exterior cleaning', hi: 'बाहरी हिस्से की सफाई' },
{ en: 'Shelf and rack cleaning', hi: 'शेल्फ और रैक की सफाई' },
{ en: 'Contents temporarily removed and replaced', hi: 'सामान को थोड़ी देर के लिए हटाकर वापस रखना' },
{ en: "Using customer's cleaning materials", hi: 'ग्राहक की क्लीनिंग सामग्री का उपयोग' },
      ],
      notIncludedItems: [
        { en: 'Company-supplied cleaning materials', hi: 'कंपनी द्वारा दी गई क्लीनिंग सामग्री' },
{ en: 'Defrosting and deep-freezer ice removal', hi: 'डीफ्रॉस्टिंग और डीप-फ्रीजर की बर्फ हटाना' },
{ en: 'Interior odour treatment', hi: 'अंदर की दुर्गंध दूर करना' },
{ en: 'Gasket and seal repair', hi: 'गैस्केट और सील की मरम्मत' },
      ]
    },
    {
      nameTranslations: { en: 'Terrace/ Verandah cleaning', hi: 'छत/बरामदा सफाई' },
      descriptionTranslations: { en: 'Terrace and verandah cleaning', hi: 'छत और बरामदा सफाई' },
      basePrice: 199,
      estimatedTime: '45 mins (up to 300sq ft)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786687058/Terrace_and_verandah_o2d8ll.png',
      includedItems: [
       { en: 'Terrace and verandah sweeping', hi: 'छत और बरामदे में झाड़ू लगाना' },
{ en: 'Terrace and verandah floor mopping', hi: 'छत और बरामदे के फर्श पर पोछा लगाना' },
{ en: "Using customer's cleaning materials", hi: 'ग्राहक की क्लीनिंग सामग्री का उपयोग' },
      ],
      notIncludedItems: [
        { en: 'Company-supplied cleaning materials', hi: 'कंपनी द्वारा दी गई क्लीनिंग सामग्री' },
{ en: 'Railing and grille scrubbing', hi: 'रेलिंग और ग्रिल की रगड़कर सफाई' },
{ en: 'Potted-plant area clearing', hi: 'गमलों के आसपास की जगह की सफाई' },
{ en: 'Drain unclogging', hi: 'नाली की रुकावट हटाना' },
      ]
    },
    {
      nameTranslations: { en: 'Sofa cleaning', hi: 'सोफा सफाई' },
      descriptionTranslations: { en: 'Sofa deep cleaning service', hi: 'सोफा गहरी सफाई सेवा' },
      basePrice: 199,
      estimatedTime: '30 mins (up to 5 seater)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431898/male-sofa-cleaner_h3vrwz.png',
      includedItems: [
        { en: 'Dry vacuum cleaning', hi: 'सूखी वैक्यूम सफाई' },
{ en: 'Surface wiping', hi: 'सतह की सफाई' },
{ en: 'Up to 5-seater sofa set', hi: 'अधिकतम 5-सीटर सोफा सेट' },
{ en: "Using customer's cleaning materials", hi: 'ग्राहक की क्लीनिंग सामग्री का उपयोग' },
      ],
      notIncludedItems: [
        { en: 'Company-supplied upholstery shampoo', hi: 'कंपनी द्वारा दिया गया अपहोल्स्ट्री शैम्पू' },
{ en: 'Stain and odour removal', hi: 'दाग और दुर्गंध हटाना' },
{ en: 'Leather conditioning', hi: 'लेदर की कंडीशनिंग' },
{ en: 'Cushion-cover removal and washing', hi: 'कुशन कवर निकालकर धोना' },
      ]
    },
    {
      nameTranslations: { en: 'Carpet cleaning', hi: 'कालीन सफाई' },
      descriptionTranslations: { en: 'Carpet and rug cleaning', hi: 'कालीन और गलीचा सफाई' },
      basePrice: 199,
      estimatedTime: '30 mins (up to 100sq ft)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431892/female-carpet-cleaner_u4teld.png',
      includedItems: [
        { en: 'Dry vacuum cleaning', hi: 'सूखी वैक्यूम सफाई' },
{ en: 'Surface cleaning', hi: 'सतह की सफाई' },
{ en: 'Coverage up to 100 sq ft', hi: '100 वर्ग फुट तक की सफाई' },
{ en: "Using customer's cleaning materials", hi: 'ग्राहक की क्लीनिंग सामग्री का उपयोग' },
      ],
      notIncludedItems: [
        { en: 'Company-supplied carpet shampoo', hi: 'कंपनी द्वारा दिया गया कार्पेट शैम्पू' },
{ en: 'Deep stain and odour removal', hi: 'गहरे दाग और दुर्गंध हटाना' },
{ en: 'Fringe and tassel hand-washing', hi: 'फ्रिंज और टैसल को हाथ से धोना' },
{ en: 'Area beyond 100 sq ft', hi: '100 वर्ग फुट से अधिक क्षेत्र' },
      ]
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
        isTrending: service.isTrending || false,
        includedItems: service.includedItems || [],
        notIncludedItems: service.notIncludedItems || [],
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
      basePrice: 99,
      estimatedTime: '15 mins (1tap)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431904/tap-repair_cmbhfy.png',
      isTrending: false,
      includedItems: [
{ en: 'Diagnosis and repair of 1 leaking or faulty tap', hi: '1 लीक या खराब नल की जांच और मरम्मत' },
{ en: 'Minor washer or gasket replacement', hi: 'छोटे वॉशर या गैस्केट को बदलना' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
        { en: 'Spare-part cost (additional charges apply if required)', hi: 'स्पेयर पार्ट्स की लागत (आवश्यक होने पर अतिरिक्त शुल्क लागू होगा)' },
{ en: 'Tap replacement', hi: 'नल बदलना' },
{ en: 'More than 1 tap', hi: '1 से अधिक नल' },
      ]
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
      basePrice: 125,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786688409/shower_repair_hypk9y.png',
      includedItems: [
        { en: 'Handle repair or adjustment', hi: 'हैंडल की मरम्मत या समायोजन' },
{ en: 'Shower-head repair or replacement', hi: 'शॉवर हेड की मरम्मत या बदलना' },
{ en: 'Replacement of existing fittings', hi: 'मौजूदा फिटिंग को बदलना' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
        { en: 'Spare-part cost', hi: 'स्पेयर पार्ट्स की लागत' },
{ en: 'Concealed diverter or mixer repair', hi: 'कंसील्ड डायवर्टर या मिक्सर की मरम्मत' },
{ en: 'Wall-tile opening', hi: 'दीवार की टाइल खोलना' },
      ]
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
      basePrice: 249,
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786688708/motor_repair_j6gulm.png',
      includedItems: [
        { en: 'Wiring check and repair', hi: 'वायरिंग की जांच और मरम्मत' },
{ en: 'Switch check and repair', hi: 'स्विच की जांच और मरम्मत' },
{ en: 'Capacitor check and repair', hi: 'कैपेसिटर की जांच और मरम्मत' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
        { en: 'Spare-part cost', hi: 'स्पेयर पार्ट्स की लागत' },
{ en: 'Motor rewinding', hi: 'मोटर की रीवाइंडिंग' },
{ en: 'New motor installation', hi: 'नई मोटर की स्थापना' },
      ]
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
      basePrice: 125,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431901/pipeline-leakage_qvxhf4.png',
      includedItems: [
        { en: 'Minor leak sealing', hi: 'छोटे रिसाव को सील करना' },
{ en: 'Joint or fitting tightening', hi: 'जॉइंट या फिटिंग को कसना' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
        { en: 'Spare-part cost', hi: 'स्पेयर पार्ट्स की लागत' },
{ en: 'Concealed-pipe repair requiring wall breaking', hi: 'दीवार तोड़कर छिपी हुई पाइप की मरम्मत' },
{ en: 'Full pipeline replacement', hi: 'पूरी पाइपलाइन बदलना' },
      ]
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
      basePrice: 99,
      estimatedTime: '15 mins (1 unit)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786688921/Toilet_flush_repair_lymqzt.png',
      includedItems: [
      { en: 'Flush tank mechanism repair for 1 unit', hi: '1 यूनिट के फ्लश टैंक की मैकेनिज्म की मरम्मत' },
{ en: 'Flush handle repair', hi: 'फ्लश हैंडल की मरम्मत' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
        { en: 'Spare-part cost', hi: 'स्पेयर पार्ट्स की लागत' },
{ en: 'Flush tank replacement', hi: 'फ्लश टैंक बदलना' },
{ en: 'More than 1 unit', hi: '1 से अधिक यूनिट' },
      ]
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
      basePrice: 99,
      estimatedTime: '15 mins(1 unit)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689145/jet_spray_repair_xcgekk.png',
      includedItems: [
        { en: 'Leak or trigger repair for 1 jet spray', hi: '1 जेट स्प्रे के रिसाव या ट्रिगर की मरम्मत' },
{ en: 'Hose reconnection', hi: 'होज़ को दोबारा जोड़ना' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
       { en: 'Spare-part cost', hi: 'स्पेयर पार्ट्स की लागत' },
{ en: 'Spray-gun replacement', hi: 'स्प्रे गन बदलना' },
{ en: 'More than 1 unit', hi: '1 से अधिक यूनिट' },
      ]
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
      estimatedTime: '60 mins (1 hour slab)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689310/other_plumbing_service_xwdorb.png',
      includedItems: [
{ en: 'Other plumbing jobs not listed above', hi: 'ऊपर सूचीबद्ध नहीं किए गए अन्य प्लंबिंग कार्य' },
{ en: "1 hour of professional's time", hi: 'प्रोफेशनल के 1 घंटे का समय' },
{ en: 'Basic plumbing tools', hi: 'बुनियादी प्लंबिंग उपकरण' },
      ],
      notIncludedItems: [
        { en: 'Spare-part and material cost', hi: 'स्पेयर पार्ट्स और सामग्री की लागत' },
{ en: 'Work beyond 1 hour (additional hourly charges apply)', hi: '1 घंटे से अधिक का काम (अतिरिक्त प्रति घंटा शुल्क लागू होगा)' },
{ en: 'Civil or tiling work', hi: 'सिविल या टाइलिंग का काम' },
      ]
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
        estimatedTime: service.estimatedTime,
        imageUrl: service.imageUrl || null,
        status: 'ACTIVE',
        isTrending: service.isTrending || false,
        isComingSoon: true,
        includedItems: service.includedItems || [],
        notIncludedItems: service.notIncludedItems || [],
      },
    });
    console.log(`    └── ✅ Created service: ${service.nameTranslations.en} (Coming Soon)`);
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
      basePrice: 99,
      estimatedTime: '20 mins(1 point)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431891/light-installation_jiemgi.png',
      includedItems: [
        { en: 'Fitting of 1 customer-provided light fixture', hi: '1 ग्राहक द्वारा उपलब्ध कराए गए लाइट फिटिंग को लगाना' },
{ en: 'Installation on existing wiring point', hi: 'मौजूदा वायरिंग पॉइंट पर इंस्टॉलेशन' },
      ],
      notIncludedItems: [
        { en: 'New wiring or point creation', hi: 'नई वायरिंग या नया पॉइंट बनाना' },
{ en: 'Light fixture cost', hi: 'लाइट फिटिंग की लागत' },
{ en: 'More than 1 point', hi: '1 से अधिक पॉइंट' },
      ]
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
      basePrice: 399,
      estimatedTime: '60 mins(1 hour slab)',
      imageUrl:'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431904/wiring-issues_otsci3.png',
      includedItems: [
       { en: 'Diagnosis of faulty wiring', hi: 'खराब वायरिंग की जांच' },
{ en: "Repair of faulty wiring for 1 hour", hi: '1 घंटे तक खराब वायरिंग की मरम्मत' },
{ en: "1 hour of professional's time", hi: 'प्रोफेशनल के 1 घंटे का समय' },
{ en: 'Basic electrical tools', hi: 'बुनियादी इलेक्ट्रिकल उपकरण' },
      ],
      notIncludedItems: [
       { en: 'Cable or wire cost', hi: 'केबल या वायर की लागत' },
{ en: 'Work beyond 1 hour (additional charges apply)', hi: '1 घंटे से अधिक का काम (अतिरिक्त शुल्क लागू होगा)' },
{ en: 'Full-home rewiring (separate quotation)', hi: 'पूरे घर की रीवायरिंग (अलग से कोटेशन दिया जाएगा)' },
      ]
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
      basePrice: 99,
      estimatedTime: '15 mins(1 fan)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431890/fan-installation_innz8k.png',
      isTrending: false,
      includedItems: [
       { en: 'Fitting of 1 customer-provided domestic ceiling/wall fan', hi: '1 ग्राहक द्वारा उपलब्ध कराए गए घरेलू सीलिंग/वॉल फैन को लगाना' },
{ en: 'Installation on existing point', hi: 'मौजूदा पॉइंट पर इंस्टॉलेशन' },
      ],
      notIncludedItems: [
        { en: 'Fan cost', hi: 'पंखे की लागत' },
{ en: 'New wiring or hook installation', hi: 'नई वायरिंग या हुक लगाना' },
{ en: 'More than 1 fan', hi: '1 से अधिक पंखे' },
      ]
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
      basePrice: 125,
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786688222/Fan_repair_txvyuw.png',
      includedItems: [
        { en: 'Capacitor diagnosis and repair', hi: 'कैपेसिटर की जांच और मरम्मत' },
{ en: 'Regulator diagnosis and repair', hi: 'रेगुलेटर की जांच और मरम्मत' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
        { en: 'Spare-part cost', hi: 'स्पेयर पार्ट्स की लागत' },
{ en: 'Motor rewinding', hi: 'मोटर की रीवाइंडिंग' },
{ en: 'Blade balancing beyond basic adjustment', hi: 'सामान्य समायोजन से अधिक ब्लेड बैलेंसिंग' },
      ]
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
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689541/washing_machine_repair_txrviy.png',
      includedItems: [
        { en: 'Drainage issue diagnosis and repair', hi: 'ड्रेनेज की समस्या की जांच और मरम्मत' },
{ en: 'Spin issue diagnosis and repair', hi: 'स्पिन की समस्या की जांच और मरम्मत' },
{ en: 'Door-lock issue diagnosis and repair', hi: 'डोर लॉक की समस्या की जांच और मरम्मत' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
        { en: 'Spare-part cost', hi: 'स्पेयर पार्ट्स की लागत' },
      ]
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
      basePrice: 499,
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689494/washing_Machine_installation_yvtbx4.png',
      includedItems: [
      { en: 'Semi-automatic washing machine unboxing', hi: 'सेमी-ऑटोमैटिक वॉशिंग मशीन की अनबॉक्सिंग' },
{ en: 'Machine levelling', hi: 'मशीन को समतल करना' },
{ en: 'Inlet and outlet connection', hi: 'इनलेट और आउटलेट कनेक्शन' },
{ en: 'First-run check', hi: 'पहली बार मशीन चलाकर जांच करना' },
      ],
      notIncludedItems: [
       { en: 'Plumbing point creation', hi: 'प्लंबिंग पॉइंट बनाना' },
{ en: 'Stand or cabinet installation', hi: 'स्टैंड या कैबिनेट लगाना' },
{ en: 'Electrical point installation', hi: 'इलेक्ट्रिकल पॉइंट लगाना' },
      ]
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
      basePrice: 999,
      estimatedTime: '90 mins(Window AC up to 1.5 ton)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689661/Ac_install_jls1ne.png',
      includedItems: [
       { en: 'AC unit fitting', hi: 'AC यूनिट लगाना' },
{ en: 'Standard bracket installation', hi: 'स्टैंडर्ड ब्रैकेट लगाना' },
{ en: 'Basic electrical connection', hi: 'बेसिक इलेक्ट्रिकल कनेक्शन' },
{ en: 'Gas charge check', hi: 'गैस चार्ज की जांच' },
{ en: 'Up to 3 ft standard piping', hi: '3 फीट तक की स्टैंडर्ड पाइपिंग' },
      ],
      notIncludedItems: [
        { en: 'Piping or wiring beyond 3 ft (additional charges apply)', hi: '3 फीट से अधिक पाइपिंग या वायरिंग (अतिरिक्त शुल्क लागू होगा)' },
{ en: 'Stabilizer installation', hi: 'स्टेबलाइज़र लगाना' },
{ en: 'Wall cutting for cable or pipe', hi: 'केबल या पाइप के लिए दीवार काटना' },
{ en: 'Drainage extension beyond 5 ft', hi: '5 फीट से अधिक ड्रेनेज एक्सटेंशन' },
      ]
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
      basePrice: 499,
      estimatedTime: '45 mins(Window AC)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690000/Ac_service_yhdb9f.png',
      includedItems: [
        { en: 'Filter and coil cleaning', hi: 'फिल्टर और कॉइल की सफाई' },
{ en: 'Condenser jet-wash (dry service)', hi: 'कंडेंसर की जेट-वॉश सफाई (ड्राई सर्विस)' },
{ en: 'Gas-pressure check', hi: 'गैस प्रेशर की जांच' },
      ],
      notIncludedItems: [
        { en: 'Gas top-up or refill (book AC Gas Refill separately)', hi: 'गैस टॉप-अप या रिफिल (AC गैस रिफिल की अलग से बुकिंग करें)' },
{ en: 'Spare-part replacement', hi: 'स्पेयर पार्ट्स बदलना' },
{ en: 'Wet or foam-jet service (additional charges apply)', hi: 'वेट या फोम-जेट सर्विस (अतिरिक्त शुल्क लागू होगा)' },
      ]
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
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786689806/Ac_repair_yshgdz.png',
      includedItems: [
        { en: 'Cooling issue diagnosis and repair', hi: 'कूलिंग की समस्या की जांच और मरम्मत' },
{ en: 'Remote issue diagnosis and repair', hi: 'रिमोट की समस्या की जांच और मरम्मत' },
{ en: 'Switch issue diagnosis and repair', hi: 'स्विच की समस्या की जांच और मरम्मत' },
{ en: 'No spare-part cost included', hi: 'स्पेयर पार्ट्स की लागत शामिल नहीं है' },
      ],
      notIncludedItems: [
       { en: 'Spare-part cost', hi: 'स्पेयर पार्ट्स की लागत' },
{ en: 'Gas refill (book separately)', hi: 'गैस रिफिल (अलग से बुकिंग करें)' },
      ]
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
      estimatedTime: '45 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690075/Ac_gas_refill_bwrdbh.png',
      includedItems: [
       { en: 'Gas top-up for 1 ton window AC', hi: '1 टन विंडो AC के लिए गैस टॉप-अप' },
{ en: 'Leak check at 1 point', hi: '1 पॉइंट पर गैस लीकेज की जांच' },
      ],
      notIncludedItems: [
        { en: 'Leak repair beyond 1 point', hi: '1 पॉइंट से अधिक गैस लीकेज की मरम्मत' },
{ en: 'Welding beyond 1 point', hi: '1 पॉइंट से अधिक वेल्डिंग का काम' },
{ en: 'Separate quotation required', hi: 'अलग से कोटेशन की आवश्यकता होगी' },
      ]
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
      basePrice: 499,
      estimatedTime: '45 mins(single door fridge)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690248/fridge_repair_bu7fsn.png',
      includedItems: [
         {
    en: 'Diagnosis and repair of cooling, thermostat or minor electrical issues',
    hi: 'कूलिंग, थर्मोस्टैट या मामूली इलेक्ट्रिकल समस्याओं का निदान और मरम्मत'
  },
  {
    en: 'Spare parts unless specifically stated',
    hi: 'स्पेयर पार्ट्स, जब तक विशेष रूप से शामिल न हों'
  }
      ],
   notIncludedItems: [
  {
    en: 'Spare parts and gas cost',
    hi: 'स्पेयर पार्ट्स और गैस की लागत'
  },
  {
    en: 'Compressor replacement',
    hi: 'कंप्रेसर बदलने की लागत'
  },
  {
    en: 'Double-door or frost-free specific issues',
    hi: 'डबल-डोर या फ्रॉस्ट-फ्री से संबंधित विशेष समस्याएं'
  },
  {
    en: 'Special repairs quoted separately',
    hi: 'विशेष मरम्मत के लिए अलग से शुल्क'
  }
]},
    {
      nameTranslations: {
        en: 'Socket repair/Installation',
        hi: 'सॉकेट इंस्टालेशन',
      },
      descriptionTranslations: {
        en: 'Electrical socket installation',
        hi: 'इलेक्ट्रिकल सॉकेट इंस्टालेशन',
      },
      basePrice: 99,
      estimatedTime: '15 mins(1 socket)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690343/socket_repai_aec63c.png',
     includedItems: [
  {
    en: 'Repair or replacement of 1 socket on an existing wiring point',
    hi: 'मौजूदा वायरिंग पॉइंट पर 1 सॉकेट की मरम्मत या बदलना'
  }
],notIncludedItems: [
  {
    en: 'Socket cost for premium fittings',
    hi: 'प्रीमियम फिटिंग के लिए सॉकेट की लागत'
  },
  {
    en: 'New electrical point or wiring',
    hi: 'नया इलेक्ट्रिकल पॉइंट या वायरिंग'
  },
  {
    en: 'Additional sockets beyond 1',
    hi: '1 से अधिक अतिरिक्त सॉकेट'
  }
]
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
      basePrice: 99,
      estimatedTime: '15 mins(1 switch)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431904/switch-repair_h38eku.png',
     includedItems: [
  {
    en: 'Repair or replacement of 1 switch',
    hi: '1 स्विच की मरम्मत या बदलना'
  }
],
    notIncludedItems: [
  {
    en: 'Switch cost',
    hi: 'स्विच की लागत'
  },
  {
    en: 'New point wiring',
    hi: 'नई पॉइंट वायरिंग'
  },
  {
    en: 'Additional switches beyond 1',
    hi: '1 से अधिक अतिरिक्त स्विच'
  }
]
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
      basePrice: 125,
      estimatedTime: '30 mins(single MCB)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690477/mcb_repair_hkieuz.png',
     includedItems: [
  {
    en: 'Diagnosis and fixing of 1 MCB tripping or loose connection issue',
    hi: '1 MCB की ट्रिपिंग या ढीले कनेक्शन की समस्या का निदान और समाधान'
  }
],
      notIncludedItems: [
  {
    en: 'MCB unit cost',
    hi: 'MCB यूनिट की लागत'
  },
  {
    en: 'Distribution board upgrade',
    hi: 'डिस्ट्रीब्यूशन बोर्ड अपग्रेड'
  },
  {
    en: 'Additional MCBs beyond 1',
    hi: '1 से अधिक अतिरिक्त MCB'
  }
]
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
      estimatedTime: '30 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690655/oven_repair_db0zgb.png',
       includedItems: [
  {
    en: 'Microwave minor issue diagnosis and repair — door, switch or turntable',
    hi: 'माइक्रोवेव की मामूली समस्या का निदान और मरम्मत — दरवाज़ा, स्विच या टर्नटेबल'
  }

      ],
     notIncludedItems: [
  {
    en: 'Spare-part cost',
    hi: 'स्पेयर पार्ट की लागत'
  }
]
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
      basePrice: 125,
      estimatedTime: '20 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690739/Iron_repair_pqhf8k.png',
    includedItems: [
  {
    en: 'Cord or plug repair or replacement',
    hi: 'कॉर्ड या प्लग की मरम्मत या बदलना'
  }
],
    notIncludedItems: [
  {
    en: 'Spare-part cost for heating element',
    hi: 'हीटिंग एलिमेंट की स्पेयर पार्ट लागत'
  },
  {
    en: 'Steam-generator iron repairs',
    hi: 'स्टीम-जेनरेटर आयरन की मरम्मत'
  }
]
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
      basePrice: 399,
      estimatedTime: '60 mins(1 hour slab)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786690855/other_electrician_service_n6vkhk.png',
      includedItems: [
  {
    en: "First hour of professional's time",
    hi: 'प्रोफेशनल का पहले एक घंटे का समय'
  },
  {
    en: 'Basic electrical tools',
    hi: 'बुनियादी इलेक्ट्रिकल उपकरण'
  }
],
      notIncludedItems: [
  {
    en: 'Material or part cost',
    hi: 'सामग्री या पार्ट की लागत'
  },
  {
    en: 'Work beyond 1 hour',
    hi: '1 घंटे से अधिक का काम'
  }
]
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
        estimatedTime: service.estimatedTime,
        imageUrl: service.imageUrl || null,
        status: 'ACTIVE',
        isTrending: service.isTrending || false,
        isComingSoon: true,
        includedItems: service.includedItems || [],
        notIncludedItems: service.notIncludedItems || [],
      },
    });
    console.log(`    └── ✅ Created service: ${service.nameTranslations.en} (Coming Soon)`);
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
      basePrice: 299,
      estimatedTime: '60 mins(1 hour slab)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691541/gardening_voitqg.png',
      isTrending: true,
     includedItems: [
  {
    en: 'Pruning of existing garden and potted plants',
    hi: 'मौजूदा बगीचे और गमले के पौधों की छंटाई'
  },
  {
    en: 'Weeding',
    hi: 'खरपतवार हटाना'
  },
  {
    en: 'Watering plants',
    hi: 'पौधों को पानी देना'
  },
  {
    en: 'Basic upkeep of existing garden and potted plants for 1 hour',
    hi: '1 घंटे तक मौजूदा बगीचे और गमले के पौधों की सामान्य देखभाल'
  }
],
     notIncludedItems: [
  {
    en: 'Plant, soil or fertilizer cost',
    hi: 'पौधे, मिट्टी या खाद की लागत'
  },
  {
    en: 'Landscaping or garden redesign',
    hi: 'लैंडस्केपिंग या बगीचे का पुनः डिज़ाइन'
  },
  {
    en: 'Pest treatment for plants',
    hi: 'पौधों के लिए कीट उपचार'
  },
  {
    en: 'Work beyond 1 hour',
    hi: '1 घंटे से अधिक का काम'
  }
]
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
      basePrice: 199,
      estimatedTime: '30 mins(Hatchback)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691769/car_wash_htmjxd.png',
      isTrending: false,
     includedItems: [
  {
    en: 'Exterior foam wash',
    hi: 'बाहरी फोम वॉश'
  },
  {
    en: 'Tyre cleaning',
    hi: 'टायर की सफाई'
  },
  {
    en: 'Window wipe',
    hi: 'खिड़कियों की सफाई'
  }
],
      notIncludedItems: [
  {
    en: 'Interior vacuuming or detailing',
    hi: 'इंटीरियर वैक्यूमिंग या डीटेलिंग'
  },
  {
    en: 'Waxing or polishing',
    hi: 'वैक्सिंग या पॉलिशिंग'
  },
  {
    en: 'Sedan or SUV service',
    hi: 'सेडान या SUV की सर्विस'
  },
  {
    en: 'Water if unavailable on-site',
    hi: 'यदि साइट पर पानी उपलब्ध न हो तो पानी की व्यवस्था'
  }
]
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
      basePrice: 99,
      estimatedTime: '20 mins(Scooter)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691825/two_wheeler_wash_marazh.png',
      isTrending: false,
     includedItems: [
  {
    en: 'Exterior wash and wipe-down',
    hi: 'बाहरी धुलाई और पोंछाई'
  },
  {
    en: "Customer's water and power access",
    hi: 'ग्राहक द्वारा पानी और बिजली की सुविधा'
  }
],
     notIncludedItems: [
  {
    en: 'Chain lubrication or polishing',
    hi: 'चेन की लुब्रिकेशन या पॉलिशिंग'
  },
  {
    en: 'Motorcycles above scooter size',
    hi: 'स्कूटर से बड़े आकार की मोटरसाइकिल'
  },
  {
    en: 'Storage-compartment cleaning',
    hi: 'स्टोरेज कम्पार्टमेंट की सफाई'
  }
]
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
      estimatedTime: '60 mins(1 hour slab)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786691873/Home_assistance_rutn95.png',
      isTrending: false,
     includedItems: [
  {
    en: 'General help with errands and light chores as briefed',
    hi: 'निर्देश के अनुसार सामान्य कामों और हल्के घरेलू कार्यों में सहायता'
  },
  {
    en: 'Up to 1 hour of service',
    hi: 'अधिकतम 1 घंटे की सेवा'
  }
],
      notIncludedItems: [
  {
    en: 'Specialist tasks covered under other categories',
    hi: 'अन्य श्रेणियों के अंतर्गत आने वाले विशेषज्ञ कार्य'
  },
  {
    en: 'Work beyond 1 hour',
    hi: '1 घंटे से अधिक का काम'
  }
]
    },
    {
      nameTranslations: {
        en: 'Water tank cleaning (Over Hang)',
        hi: 'पानी की टंकी सफाई (ओवर हैंग)',
      },
      descriptionTranslations: {
        en: 'Water tank cleaning and maintenance',
        hi: 'पानी की टंकी सफाई और रखरखाव',
      },
      basePrice:199,
      estimatedTime: '1 min(Per 10 litre capacity)',
       imageUrl:'https://res.cloudinary.com/dcmoseix9/image/upload/v1788168972/water_tank_overhang_okq13l.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Draining the water tank',
    hi: 'पानी की टंकी खाली करना'
  },
  {
    en: 'Tank scrubbing and cleaning',
    hi: 'टंकी की रगड़कर सफाई करना'
  },
  {
    en: 'Sediment and sludge removal',
    hi: 'जमा तलछट और गाद हटाना'
  },
  {
    en: 'Refilling the tank using customer’s water source',
    hi: 'ग्राहक के पानी के स्रोत का उपयोग करके टंकी को फिर से भरना'
  }
],
      notIncludedItems: [
  {
    en: 'Underground tank cleaning',
    hi: 'भूमिगत टंकी की सफाई'
  },
  {
    en: 'Tanks above 500L capacity',
    hi: '500 लीटर से अधिक क्षमता वाली टंकियां'
  },
  {
    en: 'Disinfection chemical cost',
    hi: 'कीटाणुनाशक रसायन की लागत'
  },
  {
    en: 'Plumbing repair',
    hi: 'प्लंबिंग की मरम्मत'
  },
  {
    en: 'Emptying the tank before the professional arrives',
    hi: 'प्रोफेशनल के आने से पहले टंकी खाली करना'
  }
]
    },
    {
  nameTranslations: {
    en: 'Water Tank Cleaning (Underground)',
    hi: 'पानी की टंकी की सफाई (भूमिगत)',
  },
  descriptionTranslations: {
    en: 'Underground water tank cleaning and maintenance',
    hi: 'भूमिगत पानी की टंकी की सफाई और रखरखाव',
  },
  basePrice: 199,
  estimatedTime: '1.25 mins(per 10 litre capacity)',
  imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692040/water_tank_cleaning_ir8u0g.png',
  isTrending: false,
 includedItems: [
  {
    en: 'Draining the water tank',
    hi: 'पानी की टंकी खाली करना'
  },
  {
    en: 'Scrubbing and cleaning the tank',
    hi: 'टंकी की रगड़कर सफाई करना'
  },
  {
    en: 'Sediment and sludge removal',
    hi: 'तलछट और गाद हटाना'
  },
  {
    en: 'Refilling using customer’s water source',
    hi: 'ग्राहक के पानी के स्रोत का उपयोग करके टंकी को फिर से भरना'
  },
  {
    en: 'Water removal before Houcee Professional’s arrival',
    hi: 'Houcee प्रोफेशनल के आने से पहले पानी निकालना'
  }
],
notIncludedItems: [
  {
    en: 'Disinfection chemical cost',
    hi: 'कीटाणुनाशक रसायन की लागत'
  },
  {
    en: 'Plumbing repair',
    hi: 'प्लंबिंग की मरम्मत'
  }
],
},
{
  nameTranslations: {
    en: 'Complete House Cleaning (1 BHK)',
    hi: 'पूरे घर की सफाई (1 BHK)',
  },
  descriptionTranslations: {
    en: 'Complete house cleaning service for a 1 BHK home',
    hi: '1 BHK घर के लिए पूरी सफाई की सेवा',
  },
  basePrice: 1999,
  estimatedTime: '180 mins',
  imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1788168964/1bhk_g23tdg.png',
  isTrending: true,
  includedItems: [
    { en: 'Deep floor mopping', hi: 'फर्श की गहरी सफाई और पोछा' },
{ en: 'Company-supplied detergent and disinfectant', hi: 'कंपनी द्वारा दिया गया डिटर्जेंट और कीटाणुनाशक' },
{ en: 'Mopping under reachable furniture', hi: 'पहुंच में आने वाले फर्नीचर के नीचे पोछा लगाना' },
{ en: 'Floor stain spot-treatment', hi: 'फर्श के दागों की विशेष सफाई' },
  ],
  notIncludedItems: [
    { en: 'Marble polishing', hi: 'मार्बल की पॉलिशिंग' },
{ en: 'Tile grout scrubbing (book cleaning add-on)', hi: 'टाइल के ग्राउट की रगड़कर सफाई (क्लीनिंग ऐड-ऑन की अलग से बुकिंग करें)' },
{ en: 'Homes above 3BHK (separate quotation)', hi: '3BHK से बड़े घर (अलग से कोटेशन दिया जाएगा)' },
  ],
},
{
  nameTranslations: {
    en: 'Complete House Cleaning (2 BHK)',
    hi: 'पूरे घर की सफाई (2 BHK)',
  },
  descriptionTranslations: {
    en: 'Complete house cleaning service for a 2 BHK home',
    hi: '2 BHK घर के लिए पूरी सफाई की सेवा',
  },
  basePrice: 2999,
  estimatedTime: '240 mins',
  imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1788168964/2bhk_wlzcc1.png',
  isTrending: false,
  includedItems: [
    { en: 'Deep floor mopping', hi: 'फर्श की गहरी सफाई और पोछा' },
{ en: 'Company-supplied detergent and disinfectant', hi: 'कंपनी द्वारा दिया गया डिटर्जेंट और कीटाणुनाशक' },
{ en: 'Mopping under reachable furniture', hi: 'पहुंच में आने वाले फर्नीचर के नीचे पोछा लगाना' },
{ en: 'Floor stain spot-treatment', hi: 'फर्श के दागों की विशेष सफाई' },
  ],
  notIncludedItems: [
    { en: 'Marble polishing', hi: 'मार्बल की पॉलिशिंग' },
{ en: 'Tile grout scrubbing (book cleaning add-on)', hi: 'टाइल के ग्राउट की रगड़कर सफाई (क्लीनिंग ऐड-ऑन की अलग से बुकिंग करें)' },
  ],
},
{
  nameTranslations: {
    en: 'Complete House Cleaning (3 BHK)',
    hi: 'पूरे घर की सफाई (3 BHK)',
  },
  descriptionTranslations: {
    en: 'Complete house cleaning service for a 3 BHK home',
    hi: '3 BHK घर के लिए पूरी सफाई की सेवा',
  },
  basePrice: 3999,
  estimatedTime: '300 mins',
  imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1788168965/3bhk_v89edr.png',
  isTrending: false,
  includedItems: [
    { en: 'Deep floor mopping', hi: 'फर्श की गहरी सफाई और पोछा' },
{ en: 'Company-supplied detergent and disinfectant', hi: 'कंपनी द्वारा दिया गया डिटर्जेंट और कीटाणुनाशक' },
{ en: 'Mopping under reachable furniture', hi: 'पहुंच में आने वाले फर्नीचर के नीचे पोछा लगाना' },
{ en: 'Floor stain spot-treatment', hi: 'फर्श के दागों की विशेष सफाई' },
  ],
  notIncludedItems: [
    { en: 'Marble polishing', hi: 'मार्बल की पॉलिशिंग' },
{ en: 'Tile grout scrubbing (book cleaning add-on)', hi: 'टाइल के ग्राउट की रगड़कर सफाई (क्लीनिंग ऐड-ऑन की अलग से बुकिंग करें)' },
  ],
},
{
  nameTranslations: {
    en: 'Complete House Cleaning (4 BHK)',
    hi: 'पूरे घर की सफाई (4 BHK)',
  },
  descriptionTranslations: {
    en: 'Complete house cleaning service for a 4 BHK home',
    hi: '4 BHK घर के लिए पूरी सफाई की सेवा',
  },
  basePrice: 4999,
  estimatedTime: '360 mins',
  imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1788168967/4bhk_le5aux.png',
  isTrending: false,
  includedItems: [
    { en: 'Deep floor mopping', hi: 'फर्श की गहरी सफाई और पोछा' },
{ en: 'Company-supplied detergent and disinfectant', hi: 'कंपनी द्वारा दिया गया डिटर्जेंट और कीटाणुनाशक' },
{ en: 'Mopping under reachable furniture', hi: 'पहुंच में आने वाले फर्नीचर के नीचे पोछा लगाना' },
{ en: 'Floor stain spot-treatment', hi: 'फर्श के दागों की विशेष सफाई' },
  ],
  notIncludedItems: [
    { en: 'Marble polishing', hi: 'मार्बल की पॉलिशिंग' },
{ en: 'Tile grout scrubbing (book cleaning add-on)', hi: 'टाइल के ग्राउट की रगड़कर सफाई (क्लीनिंग ऐड-ऑन की अलग से बुकिंग करें)' },
{ en: 'Homes above 3BHK (separate quotation)', hi: '3BHK से बड़े घर (अलग से कोटेशन दिया जाएगा)' },
  ],
},
  ];

  for (const service of generalServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: generalHomeServices.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        estimatedTime: service.estimatedTime,
        imageUrl: service.imageUrl || null,
        status: 'ACTIVE',
        isTrending: service.isTrending || false,
        includedItems: service.includedItems || [],
        notIncludedItems: service.notIncludedItems || [],
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
      basePrice: 399,
      estimatedTime: '60 mins(1 hour slab)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431905/painting_mef64a.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Touch-up and painting work as briefed',
    hi: 'निर्देश के अनुसार टच-अप और पेंटिंग का काम'
  },
  {
    en: "1 hour of professional's time",
    hi: 'प्रोफेशनल का 1 घंटे का समय'
  }
],
     notIncludedItems: [
  {
    en: 'Paint and material cost',
    hi: 'पेंट और सामग्री की लागत'
  },
  {
    en: 'Scaffolding for high walls',
    hi: 'ऊंची दीवारों के लिए मचान की व्यवस्था'
  },
  {
    en: 'Work beyond 1 hour',
    hi: '1 घंटे से अधिक का काम'
  }
]
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
      estimatedTime: '60 mins(1 hour slab)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692559/Carpenter_pudiv6.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Furniture repair, fitting and minor woodwork for 1 hour',
    hi: '1 घंटे तक फर्नीचर की मरम्मत, फिटिंग और मामूली लकड़ी का काम'
  }
],
     notIncludedItems: [
  {
    en: 'Wood and hardware material cost',
    hi: 'लकड़ी और हार्डवेयर सामग्री की लागत'
  },
  {
    en: 'New furniture fabrication',
    hi: 'नया फर्नीचर बनवाने की लागत'
  },
  {
    en: 'Work beyond 1 hour',
    hi: '1 घंटे से अधिक का काम'
  }
]
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
      basePrice: 399,
      estimatedTime: '60 mins(1 hour slab)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431900/minor-renovation_hwc98l.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Minor civil and masonry work such as tile fixing and plaster patching for 1 hour',
    hi: '1 घंटे तक मामूली सिविल और चिनाई का काम जैसे टाइल लगाना और प्लास्टर पैचिंग'
  }
],
      notIncludedItems: [
  {
    en: 'Cement, tile and material cost',
    hi: 'सीमेंट, टाइल और सामग्री की लागत'
  },
  {
    en: 'Structural work',
    hi: 'स्ट्रक्चरल काम'
  },
  {
    en: 'Work beyond 1 hour',
    hi: '1 घंटे से अधिक का काम'
  }
]
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
      basePrice: 399,
      estimatedTime: '30 mins(flat rate)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692511/pest_control_fcpk6p.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Standard home pest treatment for cockroaches and general pests',
    hi: 'कॉकरोच और सामान्य कीटों के लिए मानक घरेलू कीट नियंत्रण उपचार'
  },
  {
    en: 'Treatment for homes up to 1BHK',
    hi: '1BHK तक के घरों के लिए उपचार'
  },
  {
    en: 'Company-supplied chemical spray',
    hi: 'कंपनी द्वारा उपलब्ध कराया गया केमिकल स्प्रे'
  }
],
      notIncludedItems: [
  {
    en: 'Termite or rodent specialist treatment',
    hi: 'दीमक या चूहों के लिए विशेष कीट नियंत्रण उपचार'
  },
  {
    en: 'Homes above 2BHK',
    hi: '2BHK से बड़े घर'
  },
  {
    en: 'Furniture or pet relocation during treatment',
    hi: 'उपचार के दौरान फर्नीचर या पालतू जानवरों को स्थानांतरित करना'
  }
]
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
      estimatedTime: '60 mins(1 hour slab)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786431895/labour_ykt5a8.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Manual help for shifting, loading and basic labour tasks for 1 hour',
    hi: '1 घंटे तक सामान शिफ्ट करने, लोड करने और सामान्य मजदूरी के कामों में मैनुअल सहायता'
  }
],
      notIncludedItems: [
  {
    en: 'Vehicle or transportation cost',
    hi: 'वाहन या परिवहन की लागत'
  },
  {
    en: 'Work beyond 1 hour',
    hi: '1 घंटे से अधिक का काम'
  },
  {
    en: 'Heavy machinery operation',
    hi: 'भारी मशीनरी का संचालन'
  }
]
    },
  ];

  for (const service of repairServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: homeRepairRenovation.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        estimatedTime: service.estimatedTime,
        imageUrl: service.imageUrl || null,
        status: 'ACTIVE',
        isTrending: service.isTrending || false,
        includedItems: service.includedItems || [],
        notIncludedItems: service.notIncludedItems || [],
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
      basePrice: 599,
      estimatedTime: 'Per day(7 hours)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692801/baby_sitting_ltl9x6.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Supervised childcare as per customer instructions',
    hi: 'ग्राहक के निर्देशों के अनुसार बच्चों की निगरानी और देखभाल'
  },
  {
    en: 'Feeding and playtime as briefed',
    hi: 'निर्देश के अनुसार बच्चों को खाना खिलाना और खेलना'
  },
  {
    en: 'Hourly childcare service',
    hi: 'प्रति घंटे बच्चों की देखभाल की सेवा'
  }
],
      notIncludedItems: [
  {
    en: 'Medical care or medicine administration',
    hi: 'चिकित्सीय देखभाल या दवा देना'
  },
  {
    en: 'Outdoor outings without prior approval',
    hi: 'पूर्व अनुमति के बिना बच्चों को बाहर ले जाना'
  },
  {
    en: 'Bookings under 3 hours',
    hi: '3 घंटे से कम की बुकिंग'
  }
]
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
      basePrice: 699,
      estimatedTime: 'Per day(7 hours)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692784/elders_care_xl5elp.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Companionship and general assistance',
    hi: 'साथ और सामान्य सहायता'
  },
  {
    en: 'Mobility assistance',
    hi: 'चलने-फिरने में सहायता'
  },
  {
    en: 'Medicine reminders',
    hi: 'दवा लेने की याद दिलाना'
  },
  {
    en: 'Hourly elderly care service',
    hi: 'प्रति घंटे बुजुर्गों की देखभाल की सेवा'
  }
],
     notIncludedItems: [
  {
    en: 'Medical or nursing procedures',
    hi: 'चिकित्सीय या नर्सिंग प्रक्रियाएं'
  },
  {
    en: 'Medicine cost',
    hi: 'दवाओं की लागत'
  },
  {
    en: 'Bookings under 4 hours',
    hi: '4 घंटे से कम की बुकिंग'
  }
]
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
      basePrice: 1199,
      estimatedTime: 'Per day(7 hours)',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1786692913/patient_care_mazaf1.png',
      isTrending: false,
      includedItems: [
  {
    en: 'Vitals monitoring by a certified nurse',
    hi: 'प्रमाणित नर्स द्वारा महत्वपूर्ण संकेतों की निगरानी'
  },
  {
    en: 'Medication administration as prescribed',
    hi: 'निर्धारित अनुसार दवा देना'
  },
  {
    en: 'Wound dressing',
    hi: 'घाव की ड्रेसिंग'
  },
  {
    en: 'Mobility support',
    hi: 'चलने-फिरने में सहायता'
  },
  {
    en: 'Hourly certified nursing care',
    hi: 'प्रति घंटे प्रमाणित नर्सिंग सेवा'
  }
],
     notIncludedItems: [
  {
    en: 'Medicine and medical equipment cost',
    hi: 'दवाओं और चिकित्सा उपकरणों की लागत'
  },
  {
    en: 'Diagnostic tests',
    hi: 'नैदानिक जांच'
  },
  {
    en: 'Doctor consultation',
    hi: 'डॉक्टर से परामर्श'
  },
  {
    en: 'Bookings under 4 hours',
    hi: '4 घंटे से कम की बुकिंग'
  }
]
    },
  ];

  for (const service of careServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: babysittingElderCare.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        estimatedTime: service.estimatedTime,
        imageUrl: service.imageUrl || null,
        status: 'ACTIVE',
        isTrending: service.isTrending || false,
        includedItems: service.includedItems || [],
        notIncludedItems: service.notIncludedItems || [],
      },
    });
    console.log(`  └── ✅ Created service: ${service.nameTranslations.en}`);
  }

  // ---------------------------------------------------------
  // 6. MEHNDI AND ART
  // ---------------------------------------------------------

  const mehndiAndArt = await prisma.category.create({
    data: {
      nameTranslations: {
        en: 'Mehndi and Art',
        hi: 'मेहंदी और कला',
      },
      slug: 'mehndi-and-art',
      iconUrl:
        'https://res.cloudinary.com/dcmoseix9/image/upload/v1788169358/mehndi_category_mkiesw.png',
      order: 6,
    },
  });

  console.log('✅ Created category: Mehndi and Art');

  // ---------------------------------------------------------
  // MEHNDI AND ART SERVICES
  // ---------------------------------------------------------

  const mehndiArtServices = [
    {
      nameTranslations: {
        en: 'Mehndi and Art Services',
        hi: 'मेहंदी और कला सेवाएं',
      },
      descriptionTranslations: {
        en: 'Professional mehndi and art services for all occasions',
        hi: 'सभी अवसरों के लिए पेशेवर मेहंदी और कला सेवाएं',
      },
      basePrice: 999,
      estimatedTime: '60 mins',
      imageUrl: 'https://res.cloudinary.com/dcmoseix9/image/upload/v1788166249/mehndi_o556jv.png',
      isTrending: true,
      includedItems: [
        { en: 'Professional mehndi designs', hi: 'पेशेवर मेहंदी डिजाइन' },
        { en: 'Face painting and art services', hi: 'चेहरा पेंटिंग और कला सेवाएं' },
        { en: 'Premium quality materials', hi: 'प्रीमियम गुणवत्ता वाली सामग्री' },
        { en: 'Professional artists', hi: 'पेशेवर कलाकार' }
      ],
      notIncludedItems: [
        { en: 'Multiple design changes', hi: 'कई डिजाइन परिवर्तन' },
        { en: 'Additional materials cost', hi: 'अतिरिक्त सामग्री लागत' },
        { en: 'Complex bridal packages', hi: 'जटिल दुल्हन पैकेज' }
      ]
    }
  ];

  for (const service of mehndiArtServices) {
    await (prisma as any).service.create({
      data: {
        categoryId: mehndiAndArt.id,
        nameTranslations: service.nameTranslations,
        descriptionTranslations: service.descriptionTranslations,
        basePrice: service.basePrice,
        estimatedTime: service.estimatedTime,
        imageUrl: service.imageUrl || null,
        status: 'ACTIVE',
        isTrending: service.isTrending || false,
        includedItems: service.includedItems || [],
        notIncludedItems: service.notIncludedItems || [],
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
  console.log('6. Mehndi and Art (1 service)');

  console.log('\nSubcategories created: 2');
  console.log('Services created: 52');
  console.log('Categories created: 6');

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
    {
  name: 'Guna',
  slug: 'guna',
  aliases: ['Guna', 'Soni Colony','Bude Balaji','Bhargava Colony'],
  latitude: 24.6469,
  longitude: 77.3113,
  radiusKm: 30,
  isActive: true,
  order: 4,
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
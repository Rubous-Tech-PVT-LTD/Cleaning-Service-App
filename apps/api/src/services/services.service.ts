import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  async findAll(categoryId?: string) {
    return this.prisma.service.findMany({
      where: categoryId ? { categoryId } : {},
      include: {
        category: {
          select: { nameTranslations: true }
        },
        subcategory: {
          select: { nameTranslations: true }
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: { 
        category: true,
        subcategory: true
      }
    });
  }

  async updateServiceImage(serviceId: string, imageBase64: string) {
    try {
      const uploadResult = await this.cloudinaryService.uploadImage(imageBase64, 'services');
      
      return this.prisma.service.update({
        where: { id: serviceId },
        data: { imageUrl: uploadResult.url },
      });
    } catch (error) {
      throw new Error('Failed to update service image');
    }
  }

  async getHourlyServiceData() {
    // Fetch actual services that have an estimated time to display in 'How long does it take?'
    const servicesWithEstimations = await this.prisma.service.findMany({
      where: {
        estimatedTime: { not: null }
      },
      take: 8 // Limit to 8 estimations for the UI grid
    });

    const mappedEstimations = servicesWithEstimations.map((svc: any, idx: number) => {
      // Create a fallback icon string based on name length or something simple if needed, 
      // but the UI uses an emoji placeholder right now so we just pass the names.
      return {
        id: svc.id,
        title: {
          en: svc.nameTranslations?.en || 'Service',
          hi: svc.nameTranslations?.hi || svc.nameTranslations?.en || 'सेवा'
        },
        time: svc.estimatedTime,
        icon: 'clean' 
      };
    });

    return {
      durations: [
        { id: '0.5', label: { en: '0.5 hr', hi: '0.5 घंटे' }, price: 25, oldPrice: 125, saveAmount: 100 },
        { id: '1', label: { en: '1 hr', hi: '1 घंटा' }, price: 49, oldPrice: 250, saveAmount: 201 },
        { id: '1.5', label: { en: '1.5 hrs', hi: '1.5 घंटे' }, price: 74, oldPrice: 375, saveAmount: 301 },
        { id: '2', label: { en: '2 hrs', hi: '2 घंटे' }, price: 98, oldPrice: 500, saveAmount: 402 },
      ],
      estimations: mappedEstimations,
      whyCustomersLove: [
        { en: 'Book only the help you need', hi: 'केवल आवश्यक सहायता बुक करें' },
        { en: 'No recurring commitment required', hi: 'कोई आवर्ती प्रतिबद्धता आवश्यक नहीं' },
        { en: 'Multiple household tasks covered', hi: 'कई घरेलू कार्य शामिल' },
        { en: 'Flexible duration options', hi: 'लचीले अवधि विकल्प' },
        { en: 'Trained & verified professionals', hi: 'प्रशिक्षित और सत्यापित पेशेवर' },
        { en: 'Convenient scheduling', hi: 'सुविधाजनक शेड्यूलिंग' }
      ],
      doesNotInclude: [
        { en: 'Dry wiping of walls', hi: 'दीवारों की सूखी सफाई' },
        { en: 'Complete wardrobe cleaning and organization', hi: 'अलमारी की पूरी सफाई और व्यवस्था' },
        { en: 'Kitchen cabinet cleaning (interior and exterior)', hi: 'रसोई कैबिनेट की सफाई (अंदर और बाहर)' },
        { en: 'Shower cubicle deep cleaning', hi: 'शॉवर क्यूबिकल की डीप क्लीनिंग' },
        { en: 'Bathtub scrubbing and cleaning', hi: 'बाथटब की स्क्रबिंग और सफाई' },
        { en: 'Any other services like Deep Steam Cleaning, Car Washing or Plant Care.', hi: 'डीप स्टीम क्लीनिंग, कार वाशिंग या प्लांट केयर जैसी कोई अन्य सेवाएँ।' },
        { en: 'Chandelier cleaning and fragile glass work are excluded from this service.', hi: 'झूमर की सफाई और नाजुक कांच का काम इस सेवा से बाहर हैं।' }
      ],
      faqs: [
        { 
          question: { en: "What if the cleaning isn't completed within the selected time?", hi: "यदि चयनित समय के भीतर सफाई पूरी नहीं होती है तो क्या होगा?" }, 
          answer: { en: 'You can extend the time by paying the additional amount directly via the app.', hi: 'आप ऐप के माध्यम से सीधे अतिरिक्त राशि का भुगतान करके समय बढ़ा सकते हैं।' } 
        },
        { 
          question: { en: 'How can I trust your service?', hi: 'मैं आपकी सेवा पर कैसे भरोसा कर सकता हूँ?' }, 
          answer: { en: 'All our professionals are background verified and highly trained.', hi: 'हमारे सभी पेशेवर पृष्ठभूमि सत्यापित और उच्च प्रशिक्षित हैं।' } 
        },
        { 
          question: { en: 'Do I need to provide all the cleaning equipment?', hi: 'क्या मुझे सफाई के सभी उपकरण प्रदान करने होंगे?' }, 
          answer: { en: 'No, our professionals bring their own basic cleaning kit and chemicals.', hi: 'नहीं, हमारे पेशेवर अपनी बुनियादी सफाई किट और रसायन साथ लाते हैं।' } 
        },
        { 
          question: { en: 'How are the prices calculated?', hi: 'कीमतों की गणना कैसे की जाती है?' }, 
          answer: { en: 'Prices are based on the duration you select for the hourly service.', hi: 'कीमतें उस अवधि पर आधारित होती हैं जिसे आप प्रति घंटा सेवा के लिए चुनते हैं।' } 
        },
        { 
          question: { en: 'How do I contact support?', hi: 'मैं सहायता से कैसे संपर्क करूँ?' }, 
          answer: { en: 'You can contact support via the Help Center in the profile section.', hi: 'आप प्रोफ़ाइल अनुभाग में सहायता केंद्र के माध्यम से सहायता से संपर्क कर सकते हैं।' } 
        }
      ]
    };
  }

  getScheduleOptions() {
    // Generate dates (Today + next 3 days)
    const newDates = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      let dayLabel = d.toLocaleDateString('en-GB', { weekday: 'short' });
      if (i === 0) dayLabel = 'Today';
      else if (i === 1) dayLabel = 'Tomorrow';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      newDates.push({ id: i, dateLabel, dayLabel, dateISO: `${yyyy}-${mm}-${dd}` });
    }

    // Generate time slots (9:30 AM to 9:00 PM, 30 min intervals)
    const slots = [];
    const startTime = new Date();
    startTime.setHours(9, 30, 0, 0); // Start at 9:30 AM
    const endTime = new Date();
    endTime.setHours(21, 0, 0, 0); // End at 9:00 PM

    let current = startTime;
    while (current <= endTime) {
      slots.push(current.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
      current = new Date(current.getTime() + 30 * 60000); // add 30 mins
    }

    return { dates: newDates, timeSlots: slots };
  }

  async getTrendingServices() {
    const services = await this.prisma.service.findMany({
      where: {
        isTrending: true,
        status: 'ACTIVE'
      },
      include: {
        category: {
          select: { nameTranslations: true }
        },
        subcategory: {
          select: { nameTranslations: true }
        }
      }
    });

    return services.map(service => ({
      id: service.id,
      nameTranslations: service.nameTranslations,
      descriptionTranslations: service.descriptionTranslations,
      basePrice: service.basePrice,
      imageUrl: service.imageUrl,
      estimatedTime: service.estimatedTime,
      category: service.category,
      subcategory: service.subcategory
    }));
  }
}

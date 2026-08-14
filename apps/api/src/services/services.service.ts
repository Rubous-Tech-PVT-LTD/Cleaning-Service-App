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
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: { category: true }
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
      const name = svc.nameTranslations?.en || 'Service';
      return {
        id: svc.id,
        title: name,
        time: svc.estimatedTime,
        icon: 'clean' 
      };
    });

    return {
      durations: [
        { id: '0.5', label: '0.5 hr', price: 25, oldPrice: 125, saveAmount: 100 },
        { id: '1', label: '1 hr', price: 49, oldPrice: 250, saveAmount: 201 },
        { id: '1.5', label: '1.5 hrs', price: 74, oldPrice: 375, saveAmount: 301 },
        { id: '2', label: '2 hrs', price: 98, oldPrice: 500, saveAmount: 402 },
      ],
      estimations: mappedEstimations,
      whyCustomersLove: [
        'Book only the help you need',
        'No recurring commitment required',
        'Multiple household tasks covered',
        'Flexible duration options',
        'Trained & verified professionals',
        'Convenient scheduling'
      ],
      doesNotInclude: [
        'Dry wiping of walls',
        'Complete wardrobe cleaning and organization',
        'Kitchen cabinet cleaning (interior and exterior)',
        'Shower cubicle deep cleaning',
        'Bathtub scrubbing and cleaning',
        'Any other services like Deep Steam Cleaning, Car Washing or Plant Care.',
        'Chandelier cleaning and fragile glass work are excluded from this service.'
      ],
      faqs: [
        { question: "What if the cleaning isn't completed within the selected time?", answer: 'You can extend the time by paying the additional amount directly via the app.' },
        { question: 'How can I trust your service?', answer: 'All our professionals are background verified and highly trained.' },
        { question: 'Do I need to provide all the cleaning equipment?', answer: 'No, our professionals bring their own basic cleaning kit and chemicals.' },
        { question: 'How are the prices calculated?', answer: 'Prices are based on the duration you select for the hourly service.' },
        { question: 'How do I contact support?', answer: 'You can contact support via the Help Center in the profile section.' }
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
}

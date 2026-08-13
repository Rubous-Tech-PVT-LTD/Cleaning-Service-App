import { Injectable, Logger } from '@nestjs/common';

export interface PushPayload {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  async sendPush(payload: PushPayload | PushPayload[]): Promise<void> {
    const messages = Array.isArray(payload) ? payload : [payload];

    // Filter out invalid or missing tokens
    const valid = messages.filter(
      (m) => m.to && m.to.startsWith('ExponentPushToken['),
    );

    if (valid.length === 0) {
      this.logger.warn('⚠️ [Push] No valid Expo push tokens. Skipping.');
      return;
    }

    try {
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(valid),
      });

      interface ExpoPushResponse {
        data?: Array<{
          status: string;
          id?: string;
          message?: string;
          details?: any;
        }>;
      }

      const result = (await response.json()) as ExpoPushResponse;
      const statuses = result?.data?.map((r) => r.status) || [];
      this.logger.log(
        `✅ [Push] Sent ${valid.length} notification(s): ${JSON.stringify(statuses)}`,
      );
    } catch (error) {
      this.logger.error('❌ [Push] Failed to send notification:', error);
    }
  }

  /**
   * Convenience method: notify a user about their booking status change.
   */
  async notifyBookingStatusChange(
    pushToken: string | null | undefined,
    bookingId: string,
    status: string,
    serviceName: string,
  ): Promise<void> {
    if (!pushToken) return;

    const messages: Record<string, { title: string; body: string }> = {
      ACCEPTED: {
        title: '✅ Booking Accepted!',
        body: `Your booking for "${serviceName}" has been accepted by the provider.`,
      },
      IN_PROGRESS: {
        title: '🔧 Service Started',
        body: `Your "${serviceName}" service is now in progress.`,
      },
      COMPLETED: {
        title: '🎉 Service Completed!',
        body: `Your "${serviceName}" booking is complete. Tap to rate your experience.`,
      },
      CANCELLED: {
        title: '❌ Booking Cancelled',
        body: `Your booking for "${serviceName}" was cancelled.`,
      },
    };

    const message = messages[status];
    if (!message) return;

    await this.sendPush({
      to: pushToken,
      title: message.title,
      body: message.body,
      data: { bookingId, status, screen: 'BookingDetail' },
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    });
  }
}

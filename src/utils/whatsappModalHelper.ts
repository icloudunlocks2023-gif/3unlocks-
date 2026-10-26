import { notifyWhatsAppClicked } from './telegram';

export interface WhatsAppClickUserData {
  userId?: string;
  userEmail?: string;
  username?: string;
  clickedAt?: string;
}

/**
 * Triggers the creative WhatsApp Unavailable Modal anywhere across the app,
 * and notifies the administrator on Telegram that a user attempted WhatsApp contact.
 */
export function openWhatsAppUnavailableModal(userData?: WhatsAppClickUserData) {
  // 1. Dispatch Telegram notification to admin
  try {
    notifyWhatsAppClicked(userData).catch(() => {});
  } catch (e) {}

  // 2. Dispatch global event to open the modal
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open-whatsapp-unavailable-modal', { 
        detail: userData || {} 
      })
    );
  }
}

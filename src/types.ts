export interface DeviceOrder {
  id: string;
  imei: string;
  ecid: string;
  iosVersion: string;
  status:
    | 'checked'
    | 'pending_review'
    | 'waiting_payment'
    | 'verifying_payment'
    | 'processing'
    | 'ready_activation'
    | 'completed';
  adminFeedback?: string;
  feedbackDate?: string;
  price?: string;
  successRate?: string;
  transactionId?: string;
  paymentStatus: 'none' | 'pending' | 'approved' | 'rejected';
  processingProgress: number; // 0 to 100
  processingStage?: 'Preparing Registration' | 'Connecting To Server' | 'Registering Device' | 'Generating Activation' | 'Finalizing' | 'Completed';
  firmwareRequestStatus: 'none' | 'requested' | 'sent';
  firmwareLink?: string;
  createdAt: string;
  userId?: string;
  email?: string;
}

export interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type:
    | 'server'
    | 'order'
    | 'payment'
    | 'firmware'
    | 'maintenance'
    | 'promotion';
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  user: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface PaymentHistoryItem {
  id: string;
  orderId: string;
  imei: string;
  ecid: string;
  amount: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  customer: string;
}

export interface DeviceCheck {
  requestId: string;
  userId: string;
  username: string;
  email: string;
  imeiSerial: string;
  ecid: string;
  iosVersion: string;
  submittedAt: string;
  currentStatus: 'Waiting' | 'Reviewing' | 'Feedback Sent' | 'Expired';
  adminFeedback?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  completedAt?: string | null;
  device?: string;
  supportStatus?: string;
  successRate?: string;
  registrationRequired?: string;
  price?: string;
}


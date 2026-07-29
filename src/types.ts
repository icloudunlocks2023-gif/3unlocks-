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
  processingStage?: 'Preparing Registration' | 'Connecting To Server' | 'Registering Device' | 'Generating Activation' | 'Ready for Activation' | 'Finalizing' | 'Completed';
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
    | 'promotion'
    | 'chat'
    | 'info';
  userId?: string;
  targetUserId?: string;
  targetEmail?: string;
  targetRole?: string;
  link?: string;
  url?: string;
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
  currentStatus: 'Waiting' | 'Reviewing' | 'Feedback Sent' | 'Supported' | 'FMI OFF' | 'Not Supported' | 'Deleted' | 'Expired';
  adminFeedback?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  completedAt?: string | null;
  device?: string;
  supportStatus?: string;
  successRate?: string;
  registrationRequired?: string;
  price?: string;
  fmiStatus?: string;
  blacklistStatus?: string;
  lastUpdated?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  email: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface UserSession {
  uid: string;
  userId: string; // Format e.g. USR-7A3F9C21
  username: string;
  email: string;
  country: string;
  ipAddress: string;
  deviceBrowser: string;
  lastActive: string; // ISO timestamp string
  currentPage: string;
  isOnline?: boolean;
  lastAction?: string;
}

export interface UserActivity {
  id: string;
  uid?: string;
  userId: string; // Format e.g. USR-7A3F9C21
  username: string;
  email: string;
  action: string;
  page: string;
  timestamp: string; // ISO timestamp string
  ipAddress: string;
  country: string;
  details?: string;
  deviceBrowser?: string;
}




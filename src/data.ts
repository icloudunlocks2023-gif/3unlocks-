import { NotificationItem, ActivityLog, PaymentHistoryItem, DeviceOrder } from './types';

export const initialNotifications: NotificationItem[] = [];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    action: 'Payment Approved',
    details: 'Approved payment of 19 USDT for IMEI: 358921048821992',
    user: 'admin_root',
    time: '2026-07-16 09:12:00',
    type: 'success',
  },
  {
    id: 'log-2',
    action: 'Firmware Link Sent',
    details: 'Sent customized restore firmware link for ECID: 001122AA33FF44',
    user: 'admin_root',
    time: '2026-07-16 08:45:00',
    type: 'info',
  },
  {
    id: 'log-3',
    action: 'Device Status Reviewed',
    details: 'Updated status to Supported for IMEI: 351299448102341',
    user: 'admin_root',
    time: '2026-07-16 07:30:00',
    type: 'info',
  },
  {
    id: 'log-4',
    action: 'Database Backup',
    details: 'Automated database snapshot completed successfully.',
    user: 'system',
    time: '2026-07-16 06:00:00',
    type: 'success',
  }
];

export const initialPaymentHistory: PaymentHistoryItem[] = [];

export const initialOrders: DeviceOrder[] = [];

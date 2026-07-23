import { NotificationItem, ActivityLog, PaymentHistoryItem, DeviceOrder } from './types';

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    icon: 'RefreshCw',
    title: 'Server Version Updated',
    description: 'Server upgraded to v1.6. Added support for iPad Air & iPhone 14 series iOS 17.5+ activation unlock.',
    time: '2 hours ago',
    read: false,
    type: 'server',
  },
  {
    id: 'notif-2',
    icon: 'FileText',
    title: 'Order Status Update',
    description: 'Device IMEI: 358921048821992 has successfully completed the initial automated hardware review.',
    time: '3 hours ago',
    read: false,
    type: 'order',
  },
  {
    id: 'notif-3',
    icon: 'ShieldCheck',
    title: 'Payment Verified',
    description: 'Blockchain payment receipt of 19.00 USDT has been successfully checked and validated by nodes.',
    time: '4 hours ago',
    read: false,
    type: 'payment',
  },
  {
    id: 'notif-4',
    icon: 'Download',
    title: 'Firmware Link Prepared',
    description: 'Your customized unlock restore IPSW signature firmware is compiled and ready for download!',
    time: '4 hours ago',
    read: false,
    type: 'order',
  },
  {
    id: 'notif-5',
    icon: 'TrendingUp',
    title: 'New Promotion Active',
    description: 'Enjoy a 5% discount on bulk registration orders of 5+ devices using BEP20 network USDT.',
    time: '5 hours ago',
    read: false,
    type: 'promotion',
  },
  {
    id: 'notif-6',
    icon: 'AlertTriangle',
    title: 'Maintenance Schedule',
    description: 'Scheduled backup and node synchronization today at 23:00 UTC. Expect 10 minutes of light latency.',
    time: '1 day ago',
    read: true,
    type: 'maintenance',
  },
];

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

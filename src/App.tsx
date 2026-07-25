import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Tablet, 
  Clock, 
  Lock, 
  Unlock, 
  AlertCircle, 
  Search, 
  Copy, 
  Download, 
  ExternalLink, 
  Cpu, 
  Terminal, 
  RefreshCw, 
  Database,
  Check,
  AlertTriangle,
  FileText,
  User,
  UserCheck,
  Zap,
  Info,
  Layers,
  ChevronRight,
  BookOpen,
  CreditCard,
  X,
  Cloud,
  Laptop,
  Eye,
  Bell
} from 'lucide-react';

import { DeviceOrder, NotificationItem, ActivityLog, PaymentHistoryItem, DeviceCheck } from './types';
import { initialNotifications, initialActivityLogs, initialPaymentHistory, initialOrders } from './data';

import Header from './components/Header';
import Footer from './components/Footer';
import DeviceMockup from './components/DeviceMockup';
import PricesPage from './components/PricesPage';
import MyAccountPage from './components/MyAccountPage';
import AdminPanel from './components/AdminPanel';
import DeviceCheckWorkflow from './components/DeviceCheckWorkflow';
import SupportWidget from './components/SupportWidget';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import PolicyPage, { PolicyType } from './components/PolicyPage';

// Firebase Integrations
import { auth, db, handleFirestoreError, OperationType, cleanFirestoreData } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { trackUserActivity } from './utils/activityTracker';

const parseFeedbackTextInApp = (feedbackHtml: string) => {
  if (!feedbackHtml) return [];
  const clean = feedbackHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  const lines = clean.split('\n');
  const results: { key: string; val: string }[] = [];
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      const key = trimmed.slice(0, colonIndex).trim();
      const val = trimmed.slice(colonIndex + 1).trim();
      results.push({ key, val });
    } else {
      results.push({ key: 'Reviewer Note', val: trimmed });
    }
  });
  return results;
};

const getNotifTimestamp = (timeStr: string): number => {
  if (!timeStr) return 0;
  if (timeStr === 'Just now') return Date.now();
  const parsed = Date.parse(timeStr);
  if (!isNaN(parsed)) return parsed;
  const now = Date.now();
  const lower = timeStr.toLowerCase();
  if (lower.includes('sec')) return now - (parseInt(lower) || 30) * 1000;
  if (lower.includes('min')) return now - (parseInt(lower) || 5) * 60 * 1000;
  if (lower.includes('hour')) return now - (parseInt(lower) || 2) * 3600 * 1000;
  if (lower.includes('day')) return now - (parseInt(lower) || 1) * 86400 * 1000;
  return 0;
};

export default function App() {
  // Global Perspectives & Active Tabs
  const [perspective, setPerspective] = useState<'customer' | 'admin'>('customer');
  const [activeTab, setActiveTab] = useState<'home' | 'prices' | 'my-account' | 'login' | 'register' | 'forgot-password' | 'terms' | 'privacy' | 'refund' | 'faq'>('home');
  const [accountSubTab, setAccountSubTab] = useState<'history' | 'profile' | 'settings'>('history');

  // Firestore user metadata state
  const [profileData, setProfileData] = useState<any>(null);

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Application database stored in state and synchronized with Firestore
  const [orders, setOrders] = useState<DeviceOrder[]>(initialOrders);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [popupNotification, setPopupNotification] = useState<NotificationItem | null>(null);
  const [forceOpenNotif, setForceOpenNotif] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(initialPaymentHistory);
  const [deviceChecks, setDeviceChecks] = useState<DeviceCheck[]>([]);
  const [activeDeviceCheckId, setActiveDeviceCheckId] = useState<string | null>(() => {
    return localStorage.getItem('3u_active_device_check_id') || null;
  });

  const activeCheck = activeDeviceCheckId
    ? deviceChecks.find((c) => c.requestId === activeDeviceCheckId)
    : undefined;

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Client session details
  const userEmail = currentUser?.email || '';
  const adminWallet = '0x5Dd3d764DC0d2C862F3B042C95B0e192A29be4C9';

  const isUserAdmin = Boolean(
    currentUser?.email && (
      currentUser.email.toLowerCase() === 'iunlockapple01@gmail.com' ||
      currentUser.email.toLowerCase() === 'iunlockapple1427@gmail.com'
    )
  );

  // State of the device checker form
  const [imeiInput, setImeiInput] = useState('');
  const [ecidInput, setEcidInput] = useState('');
  const [iosInput, setIosInput] = useState('');

  // Scanning/Checking Device states
  const [isChecking, setIsChecking] = useState(false);
  const [checkingStep, setCheckingStep] = useState('');
  const [checkResult, setCheckResult] = useState<{
    supported: boolean;
    successRate: string;
    price: string;
    registrationRequired: string;
  } | null>(null);

  // Active Customer Device Order (current session)
  const [currentOrder, setCurrentOrder] = useState<DeviceOrder | null>(() => {
    const saved = localStorage.getItem('3u_current_order');
    return saved ? JSON.parse(saved) : null;
  });

  // Modals visibility states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTxId, setPaymentTxId] = useState('');
  const [paymentVerificationStage, setPaymentVerificationStage] = useState<'idle' | 'uploading' | 'blockchain' | 'confirming' | 'submitted'>('idle');

  // Interactive instructions modal
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [showCheckDetailsModal, setShowCheckDetailsModal] = useState(false);
  const [existingOrderErrorModal, setExistingOrderErrorModal] = useState<{
    isOpen: boolean;
    order: DeviceOrder | null;
    imeiSerial: string;
  }>({
    isOpen: false,
    order: null,
    imeiSerial: '',
  });

  // Global Server Status and Support States
  const [serverStatus, setServerStatus] = useState<'Online' | 'Offline'>('Online');
  const [isServerBusyOpen, setIsServerBusyOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Listen to global site configurations (Server Status, etc.)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_configs', 'general'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.serverStatus === 'offline') {
          setServerStatus('Offline');
        } else {
          setServerStatus('Online');
        }
      }
    }, (err) => {
      console.warn("Could not load global site config:", err);
    });
    return () => unsub();
  }, []);

  // Copy indicator helper
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Processing Animation state (simulated timer)
  const [processingTimerActive, setProcessingTimerActive] = useState(false);

  // 1. Listen to Firebase Authentication State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user && user.email) {
        trackUserActivity({
          uid: user.uid,
          userId: `USR-${user.uid.substring(0, 8).toUpperCase()}`,
          username: user.displayName || user.email.split('@')[0],
          email: user.email,
          action: 'Active Session / Authenticated',
          page: activeTab,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Track active page changes for user activity monitor
  useEffect(() => {
    if (currentUser && currentUser.email) {
      trackUserActivity({
        uid: currentUser.uid,
        userId: `USR-${currentUser.uid.substring(0, 8).toUpperCase()}`,
        username: currentUser.displayName || currentUser.email.split('@')[0],
        email: currentUser.email,
        action: `Navigated to ${activeTab}`,
        page: activeTab,
      });
    }
  }, [activeTab, currentUser]);

  // Automatically switch to admin perspective on login if user is an admin
  useEffect(() => {
    if (currentUser && currentUser.email) {
      const email = currentUser.email.toLowerCase();
      if (email === 'iunlockapple01@gmail.com' || email === 'iunlockapple1427@gmail.com') {
        setPerspective('admin');
        setActiveTab('home');
      } else {
        setPerspective('customer');
      }

      // Secure order isolation: clear active tracking order if it belongs to someone else
      if (currentOrder && currentOrder.userId !== currentUser.uid) {
        setCurrentOrder(null);
        localStorage.removeItem('3u_current_order');
      }
    } else {
      setPerspective('customer');
      // Clear active tracking order on sign-out to prevent session bleeding
      setCurrentOrder(null);
      localStorage.removeItem('3u_current_order');
    }
  }, [currentUser]);

  // Write Helpers to sync local modifications to Firestore
  const syncOrderToFirestore = async (order: DeviceOrder) => {
    try {
      await setDoc(doc(db, 'orders', order.id), cleanFirestoreData(order));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
    }
  };

  const syncNotificationToFirestore = async (notif: NotificationItem) => {
    try {
      await setDoc(doc(db, 'notifications', notif.id), cleanFirestoreData(notif));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`);
    }
  };

  const syncLogToFirestore = async (log: ActivityLog) => {
    try {
      await setDoc(doc(db, 'logs', log.id), cleanFirestoreData(log));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `logs/${log.id}`);
    }
  };

  const syncPaymentToFirestore = async (pay: PaymentHistoryItem) => {
    try {
      await setDoc(doc(db, 'payments', pay.id), cleanFirestoreData(pay));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `payments/${pay.id}`);
    }
  };

  // 2. Setup Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser) {
      // If not logged in, fallback to local initial storage for demo consistency
      setOrders(initialOrders);
      setNotifications(initialNotifications);
      setActivityLogs(initialActivityLogs);
      setPaymentHistory(initialPaymentHistory);
      return;
    }

    const isUserAdmin = currentUser.email && (
      currentUser.email.toLowerCase() === 'iunlockapple1427@gmail.com' ||
      currentUser.email.toLowerCase() === 'iunlockapple01@gmail.com'
    );

    // Orders Listener
    let ordersQuery;
    if (isUserAdmin) {
      ordersQuery = collection(db, 'orders');
    } else {
      ordersQuery = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
    }

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const list: DeviceOrder[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as DeviceOrder);
      });
      const sorted = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setOrders(sorted);
      
      // Update currentOrder in real-time to show updates on the user side without delay
      setCurrentOrder((prevCurrentOrder) => {
        if (!prevCurrentOrder) return null;
        const matched = sorted.find(ord => ord.id === prevCurrentOrder.id);
        return matched ? matched : prevCurrentOrder;
      });
    }, (err) => {
      console.warn("Firestore onSnapshot order read blocked or waiting auth", err);
    });

    // Notifications Listener
    const unsubscribeNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const validList: NotificationItem[] = [];
      const dummyIds = ['notif-1', 'notif-2', 'notif-3', 'notif-4', 'notif-5', 'notif-6'];
      const dummyTitles = ['Server Version Updated', 'Order Status Update', 'Payment Verified', 'Firmware Link Prepared', 'New Promotion Active', 'Maintenance Schedule'];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as NotificationItem;
        const isDummy = dummyIds.includes(data.id) || dummyTitles.includes(data.title);
        const isOldTestNotification = data.time === 'Just now' || 
          (data.time && !isNaN(Date.parse(data.time)) && Date.parse(data.time) < Date.parse('2026-07-25T18:35:00Z'));

        if (isDummy || isOldTestNotification) {
          deleteDoc(doc(db, 'notifications', data.id)).catch(e => console.warn("Could not delete notif:", e));
        } else {
          validList.push(data);
        }
      });

      if (validList.length > 0) {
        // Filter notifications: admins see all. Customers see global (no userId) or notifications targeted to them.
        const uEmail = currentUser.email?.toLowerCase().trim();
        const uUid = currentUser.uid?.toLowerCase().trim();
        const uDisplayId = `usr-${uUid?.substring(0, 8)}`;
        const uName = currentUser.displayName?.toLowerCase().trim();
        const uProfileName = profileData?.username?.toLowerCase().trim();
        const uProfileId = profileData?.id?.toLowerCase().trim();
        const uProfileUserId = profileData?.userId?.toLowerCase().trim();

        const filteredList = isUserAdmin
          ? validList
          : validList.filter(n => {
              if (!n.userId && !n.targetUserId && !n.targetEmail) return true; // Global notification
              const tId = (n.targetUserId || n.userId || '').toLowerCase().trim();
              const tEmail = (n.targetEmail || '').toLowerCase().trim();
              if (uUid && (tId === uUid || tId.includes(uUid) || uUid.includes(tId))) return true;
              if (uDisplayId && (tId === uDisplayId || tId.replace('usr-', '') === uUid?.substring(0, 8) || uDisplayId.includes(tId) || tId.includes(uDisplayId))) return true;
              if (uEmail && (tEmail === uEmail || tId === uEmail || tEmail.includes(uEmail) || uEmail.includes(tEmail) || tId.includes(uEmail))) return true;
              if (uName && (tId === uName || tId.includes(uName))) return true;
              if (uProfileName && (tId === uProfileName || tId.includes(uProfileName))) return true;
              if (uProfileId && (tId === uProfileId || tId.includes(uProfileId))) return true;
              if (uProfileUserId && (tId === uProfileUserId || tId.includes(uProfileUserId))) return true;
              return false;
            });
        setNotifications(filteredList.sort((a, b) => getNotifTimestamp(b.time) - getNotifTimestamp(a.time)));
      } else {
        setNotifications([]);
      }
    }, (err) => {
      console.warn("Firestore onSnapshot notification read blocked or waiting auth", err);
    });

    // Logs Listener (Admin Only)
    let unsubscribeLogs = () => {};
    if (isUserAdmin) {
      unsubscribeLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
        const list: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ActivityLog);
        });
        if (list.length > 0) {
          setActivityLogs(list.sort((a, b) => b.time.localeCompare(a.time)));
        } else {
          initialActivityLogs.forEach(log => syncLogToFirestore(log));
        }
      }, (err) => {
        console.warn("Firestore onSnapshot logs read blocked or waiting auth", err);
      });
    } else {
      setActivityLogs([]);
    }

    // Payments Listener
    let paymentsQuery;
    if (isUserAdmin) {
      paymentsQuery = collection(db, 'payments');
    } else {
      paymentsQuery = query(collection(db, 'payments'), where('customer', '==', currentUser.email));
    }

    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const list: PaymentHistoryItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PaymentHistoryItem);
      });
      setPaymentHistory(list.sort((a, b) => b.date.localeCompare(a.date)));
    }, (err) => {
      console.warn("Firestore onSnapshot payments read blocked or waiting auth", err);
    });

    // Device Checks Listener
    let deviceChecksQuery;
    if (isUserAdmin) {
      deviceChecksQuery = collection(db, 'deviceChecks');
    } else {
      deviceChecksQuery = query(collection(db, 'deviceChecks'), where('userId', '==', currentUser.uid));
    }

    const unsubscribeDeviceChecks = onSnapshot(deviceChecksQuery, (snapshot) => {
      const list: DeviceCheck[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as DeviceCheck);
      });
      setDeviceChecks(list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
    }, (err) => {
      console.warn("Firestore onSnapshot deviceChecks read blocked or waiting auth", err);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeNotifications();
      unsubscribeLogs();
      unsubscribePayments();
      unsubscribeDeviceChecks();
    };
  }, [currentUser]);

  // Listen to Firestore user registration profile metadata in real-time
  useEffect(() => {
    if (!currentUser) {
      setProfileData(null);
      return;
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfileData(snapshot.data());
      } else {
        // Fallback profile if not written on registration
        setProfileData({
          id: currentUser.uid,
          username: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email || '',
          country: 'United States',
          whatsApp: '',
          accountType: 'Personal User',
          deviceOwnership: 'Personal Devices',
          registrationDate: new Date().toISOString(),
          role: 'Customer',
          status: 'Active',
          balance: 0,
        });
      }
    }, (err) => {
      console.warn("Firestore user profile snapshot read blocked", err);
    });

    return () => unsubscribeUser();
  }, [currentUser]);

  // Enforce browser tab title and branding
  useEffect(() => {
    document.title = "3uUnlocks - Activation Lock Removal";
  }, []);

  // Protected Pages Redirect Guard
  useEffect(() => {
    if (!authLoading && !currentUser) {
      const protectedTabs = ['my-account', 'dashboard', 'orders', 'track-order', 'notifications', 'settings', 'profile'];
      if (protectedTabs.includes(activeTab)) {
        setActiveTab('login');
      }
    }
  }, [currentUser, activeTab, authLoading]);

  // Auth Operations
  const handleSignInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  useEffect(() => {
    if (currentOrder) {
      localStorage.setItem('3u_current_order', JSON.stringify(currentOrder));
    } else {
      localStorage.removeItem('3u_current_order');
    }
  }, [currentOrder]);

  // Effect to handle real-time simulation progress of the processing stage
  useEffect(() => {
    let interval: any = null;
    if (processingTimerActive && currentOrder && currentOrder.status === 'processing') {
      interval = setInterval(() => {
        setOrders((prevOrders) => {
          return prevOrders.map((ord) => {
            if (ord.id === currentOrder.id) {
              const currentProgress = ord.processingProgress;
              let nextProgress = currentProgress + Math.floor(Math.random() * 15) + 5;
              if (nextProgress >= 100) {
                nextProgress = 100;
                setProcessingTimerActive(false);
                
                // Add system notification for Completed Processing
                const alertTitle = 'Order Completed';
                const alertDesc = `Device IMEI: ${ord.imei} is fully processed. Ready for activation.`;
                triggerNotification(alertTitle, alertDesc, 'order', 'CheckCircle');

                // Log details
                addLog('Order Completed', `Processing reached 100% for IMEI: ${ord.imei}`, 'system', 'success');

                const updatedOrder: DeviceOrder = {
                  ...ord,
                  status: 'ready_activation',
                  processingProgress: 100,
                  processingStage: 'Completed',
                };
                setCurrentOrder(updatedOrder);
                return updatedOrder;
              }

              // Set processing stages dynamically depending on percentage
              let stage: DeviceOrder['processingStage'] = 'Preparing Registration';
              if (nextProgress >= 20 && nextProgress < 45) {
                stage = 'Connecting To Server';
              } else if (nextProgress >= 45 && nextProgress < 70) {
                stage = 'Registering Device';
              } else if (nextProgress >= 70 && nextProgress < 90) {
                stage = 'Generating Activation';
              } else if (nextProgress >= 90) {
                stage = 'Finalizing';
              }

              const updatedOrder: DeviceOrder = {
                ...ord,
                processingProgress: nextProgress,
                processingStage: stage,
              };
              setCurrentOrder(updatedOrder);
              return updatedOrder;
            }
            return ord;
          });
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [processingTimerActive, currentOrder]);

  // Helper: Trigger/Append a new notification to system
  const triggerNotification = (
    title: string,
    description: string,
    type: NotificationItem['type'],
    iconName: string,
    targetUserId?: string,
    targetEmail?: string
  ) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      icon: iconName,
      title,
      description,
      time: new Date().toISOString(),
      read: false,
      type,
      ...(targetUserId ? { userId: targetUserId, targetUserId } : {}),
      ...(targetEmail ? { targetEmail: targetEmail.toLowerCase() } : {})
    };
    setNotifications((prev) => [newNotif, ...prev].sort((a, b) => getNotifTimestamp(b.time) - getNotifTimestamp(a.time)));
    syncNotificationToFirestore(newNotif);
  };

  // Helper: Add operational Audit Activity logs
  const addLog = (
    action: string,
    details: string,
    user: string = 'system',
    type: ActivityLog['type'] = 'info'
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      action,
      details,
      user,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    if (currentUser) {
      syncLogToFirestore(newLog);
    }
  };

  // 1. Check Device Flow (Firestore Integrated with Auto-Lookup)
  const handleCheckDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serverStatus === 'Offline') {
      setIsServerBusyOpen(true);
      return;
    }
    if (!currentUser) {
      alert('Please login or register an account first to verify compatibility and submit device reviews.');
      setActiveTab('login');
      return;
    }
    if (!imeiInput || !ecidInput || !iosInput) {
      alert('Please fill out all check parameters (IMEI, ECID, and iOS Version) to verify compatibility.');
      return;
    }

    const cleanInputImei = imeiInput.trim().toLowerCase();
    const cleanInputEcid = ecidInput.trim().toLowerCase();

    // Set checking state immediately so button greys out & shows active animation
    setIsChecking(true);
    setCheckingStep('Connecting to unlock servers...');

    try {
      // 1. Existing Device Lookup in local state
      let foundCheck: DeviceCheck | undefined = deviceChecks.find(c => {
        const cImei = c.imeiSerial ? c.imeiSerial.trim().toLowerCase() : '';
        const cEcid = c.ecid ? c.ecid.trim().toLowerCase() : '';
        return (cleanInputImei && cImei === cleanInputImei) || (cleanInputEcid && cEcid === cleanInputEcid);
      });

      // 2. Existing Device Lookup in Firestore if not found in local state
      if (!foundCheck) {
        try {
          const q = query(
            collection(db, 'deviceChecks'),
            where('imeiSerial', '==', imeiInput.trim())
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docsData = querySnapshot.docs.map(d => d.data() as DeviceCheck);
            const completedDoc = docsData.find(d => 
              ['Feedback Sent', 'Supported', 'FMI OFF', 'Not Supported'].includes(d.currentStatus)
            );
            foundCheck = completedDoc || docsData[0];
          }
        } catch (err) {
          console.warn("Existing check lookup error:", err);
        }
      }

      // If an existing record was found for this IMEI/SN
      if (foundCheck) {
        // Run 4-second checking animation (1000ms per step = 4 seconds total)
        setCheckingStep('Connecting to unlock servers...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCheckingStep('Verifying eligibility record...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCheckingStep('Retrieving diagnostics report...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCheckingStep('Loading previous compatibility results...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Automatically set active check ID to display the previous results
        setActiveDeviceCheckId(foundCheck.requestId);
        localStorage.setItem('3u_active_device_check_id', foundCheck.requestId);

        setImeiInput('');
        setEcidInput('');
        setIosInput('');
        setIsChecking(false);
        setCheckingStep('');

        addLog('Device Check Retrieved', `Retrieved existing Compatibility check for IMEI ${foundCheck.imeiSerial}`, userEmail, 'info');
        
        triggerNotification(
          'Compatibility Record Found',
          `An existing record for IMEI / Serial ${foundCheck.imeiSerial} has been retrieved. Previous results loaded automatically.`,
          'server',
          'Info'
        );
        return;
      }

      // 3. New Device Check Submission (4-second checking animation)
      setCheckingStep('Connecting to unlock servers...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCheckingStep('Registering device parameters...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCheckingStep('Querying carrier & iCloud databases...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCheckingStep('Submitting compatibility review request...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const checkId = `check-${Math.floor(100000 + Math.random() * 900000)}`;
      const newCheck: DeviceCheck = {
        requestId: checkId,
        userId: currentUser.uid,
        username: profileData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Authenticated User',
        email: currentUser.email || 'iunlockapple1427@gmail.com',
        imeiSerial: imeiInput.trim(),
        ecid: ecidInput.trim(),
        iosVersion: iosInput.trim(),
        submittedAt: new Date().toISOString(),
        currentStatus: 'Waiting'
      };

      await setDoc(doc(db, 'deviceChecks', checkId), newCheck);
      setActiveDeviceCheckId(checkId);
      localStorage.setItem('3u_active_device_check_id', checkId);

      setImeiInput('');
      setEcidInput('');
      setIosInput('');

      addLog('Device Check Submitted', `Customer submitted Device Check Request ${checkId}`, userEmail, 'info');

      triggerNotification(
        'Device Check Submitted',
        `New compatibility check registered. Awaiting administrator review.`,
        'order',
        'Info'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `deviceChecks`);
    } finally {
      setIsChecking(false);
      setCheckingStep('');
    }
  };

  // 2. Submit Order Flow
  const handleOrderNow = () => {
    if (!checkResult) return;

    const cleanImei = imeiInput ? imeiInput.trim().toLowerCase() : '';
    const cleanEcid = ecidInput ? ecidInput.trim().toLowerCase() : '';

    const existingOrder = orders.find(o => {
      const oImei = o.imei ? o.imei.trim().toLowerCase() : '';
      const oEcid = o.ecid ? o.ecid.trim().toLowerCase() : '';
      return (cleanImei && oImei === cleanImei) || (cleanEcid && oEcid === cleanEcid);
    });

    if (existingOrder) {
      setExistingOrderErrorModal({
        isOpen: true,
        order: existingOrder,
        imeiSerial: imeiInput,
      });

      triggerNotification(
        'Order Already Exists',
        `An order for IMEI / Serial ${imeiInput} is already registered on the Unlock Activity Ledger. Please deposit funds into your account balance so that your order can be processed.`,
        'order',
        'X'
      );

      addLog(
        'Duplicate Order Attempt',
        `User attempted to create order for IMEI ${imeiInput} which is already on the Unlock Activity Ledger (Order ID: ${existingOrder.id}).`,
        userEmail,
        'warning'
      );
      return;
    }

    const newOrder: DeviceOrder = {
      id: `order-${Math.floor(100000 + Math.random() * 900000)}`,
      imei: imeiInput,
      ecid: ecidInput,
      iosVersion: iosInput,
      status: 'pending_review',
      price: checkResult.price,
      successRate: checkResult.successRate,
      paymentStatus: 'none',
      processingProgress: 0,
      firmwareRequestStatus: 'none',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser?.uid,
      email: currentUser?.email || ''
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    setCheckResult(null);
    setImeiInput('');
    setEcidInput('');
    setIosInput('');

    if (currentUser) {
      syncOrderToFirestore(newOrder);
    }

    // Trigger Notification for new submission
    triggerNotification(
      'Order Submitted',
      `Device ${newOrder.id} successfully registered for administrator review.`,
      'order',
      'Info'
    );

    addLog('Order Submitted', `Customer submitted device ${newOrder.id} for review.`, userEmail, 'info');
  };

  const handleMakePaymentForCheck = (check: DeviceCheck) => {
    const cleanImei = check.imeiSerial ? check.imeiSerial.trim().toLowerCase() : '';
    const cleanEcid = check.ecid ? check.ecid.trim().toLowerCase() : '';

    const existingOrder = orders.find(o => {
      const oImei = o.imei ? o.imei.trim().toLowerCase() : '';
      const oEcid = o.ecid ? o.ecid.trim().toLowerCase() : '';
      return (cleanImei && oImei === cleanImei) || (cleanEcid && oEcid === cleanEcid);
    });

    if (existingOrder) {
      setExistingOrderErrorModal({
        isOpen: true,
        order: existingOrder,
        imeiSerial: check.imeiSerial,
      });

      triggerNotification(
        'Order Already Exists',
        `An order for IMEI / Serial ${check.imeiSerial} is already registered on the Unlock Activity Ledger. Please deposit funds into your account balance so that your order can be processed.`,
        'order',
        'X'
      );

      addLog(
        'Duplicate Order Attempt',
        `User attempted to make payment for IMEI ${check.imeiSerial} which is already on the Unlock Activity Ledger (Order ID: ${existingOrder.id}).`,
        userEmail,
        'warning'
      );
      return;
    }

    const orderId = `order-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: DeviceOrder = {
      id: orderId,
      imei: check.imeiSerial,
      ecid: check.ecid,
      iosVersion: check.iosVersion,
      status: 'waiting_payment',
      price: check.price || '$19.00 USDT',
      successRate: check.successRate || '98.4%',
      paymentStatus: 'none',
      processingProgress: 0,
      firmwareRequestStatus: 'none',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser?.uid,
      email: currentUser?.email || ''
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    localStorage.setItem('3u_current_order', JSON.stringify(newOrder));
    
    if (currentUser) {
      syncOrderToFirestore(newOrder);
    }

    setActiveDeviceCheckId(null);
    localStorage.removeItem('3u_active_device_check_id');

    setIsPaymentModalOpen(true);

    triggerNotification(
      'Order Generated',
      `Unlock order ${orderId} created successfully. Please complete payment to begin.`,
      'order',
      'CreditCard'
    );

    addLog('Order Generated', `Order ${orderId} generated from approved Device Check ${check.requestId}`, userEmail, 'info');
  };

  // 3. Admin: Approve device review, transforms checker to feedback panel
  const handleApproveDeviceReview = (orderId: string, feedback: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: DeviceOrder = {
            ...o,
            status: 'waiting_payment',
            adminFeedback: feedback,
            feedbackDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
          if (currentOrder && currentOrder.id === orderId) {
            setCurrentOrder(updated);
          }
          if (currentUser) {
            syncOrderToFirestore(updated);
          }
          return updated;
        }
        return o;
      })
    );

    triggerNotification(
      'Device Support Approved',
      `Your device check ${orderId} is approved. Current Status: Waiting for payment.`,
      'order',
      'CheckCircle'
    );

    addLog('Device Approved', `Approved eligibility & feedback for order ${orderId}`, 'admin_root', 'success');
  };

  // 4. Customer: Make Payment Modal Submission
  const handleVerifyPayment = () => {
    if (!paymentTxId) {
      alert('Please enter your BEP20 Transaction Hash (TxID) to initiate blockchain verification.');
      return;
    }

    setPaymentVerificationStage('uploading');

    // Simulate multi-stage animation sequence
    setTimeout(() => {
      setPaymentVerificationStage('blockchain');
      setTimeout(() => {
        setPaymentVerificationStage('confirming');
        setTimeout(() => {
          setPaymentVerificationStage('submitted');
          setTimeout(() => {
            // Update order status in orders database
            setOrders((prev) =>
              prev.map((o) => {
                if (o.id === currentOrder?.id) {
                  const updated: DeviceOrder = {
                    ...o,
                    status: 'verifying_payment',
                    transactionId: paymentTxId,
                    paymentStatus: 'pending',
                  };
                  setCurrentOrder(updated);
                  if (currentUser) {
                    syncOrderToFirestore(updated);
                  }
                  return updated;
                }
                return o;
              })
            );

            // Log details
            addLog('Payment Hash Submitted', `TxID: ${paymentTxId} submitted for Order: ${currentOrder?.id}`, userEmail, 'warning');

            // Send notification to Admin (and to customer that it was submitted)
            triggerNotification(
              'Payment Verification Pending',
              'Your payment TxID has been submitted and is awaiting admin manual verification.',
              'payment',
              'Clock'
            );

            // Close modal & reset TxId input
            setIsPaymentModalOpen(false);
            setPaymentTxId('');
            setPaymentVerificationStage('idle');
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  // 5. Admin: Approve Payment
  const handleApprovePayment = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId) {
          const updated: DeviceOrder = {
            ...o,
            status: 'processing',
            paymentStatus: 'approved',
            processingProgress: 12,
            processingStage: 'Preparing Registration',
          };

          // If this is the current active order, update its view
          if (currentOrder && currentOrder.id === orderId) {
            setCurrentOrder(updated);
            setProcessingTimerActive(true); // Begin running simulated progression
          }

          // Insert into admin payment history ledger
          const newHistory: PaymentHistoryItem = {
            id: `pay-${Date.now()}`,
            orderId: o.id,
            imei: o.imei,
            ecid: o.ecid,
            amount: o.price || '19.00 USDT',
            transactionId: o.transactionId || '0xSimulatedHashManualApproved',
            status: 'approved',
            date: new Date().toISOString().replace('T', ' ').substring(0, 19),
            customer: userEmail,
          };
          setPaymentHistory((prev) => [newHistory, ...prev]);

          if (currentUser) {
            syncOrderToFirestore(updated);
            syncPaymentToFirestore(newHistory);
          }

          return updated;
        }
        return o;
      })
    );

    const targetOrder = orders.find(o => o.id === orderId);
    const tUserId = targetOrder?.userId;
    const tEmail = targetOrder?.email;

    // Send notifications
    triggerNotification(
      'Payment Verified',
      'Your payment has been successfully verified. Your order has entered processing.',
      'payment',
      'CheckCircle',
      tUserId,
      tEmail
    );

    triggerNotification(
      'Processing Started',
      `Unlock sequence initiated for Order ${orderId}. Estimated completion: 4 minutes.`,
      'order',
      'RefreshCw',
      tUserId,
      tEmail
    );

    addLog('Payment Verified', `Approved transaction hash for order ${orderId}`, 'admin_root', 'success');
  };

  // 6. Admin: Reject Payment
  const handleRejectPayment = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId) {
          const updated: DeviceOrder = {
            ...o,
            status: 'waiting_payment',
            paymentStatus: 'rejected',
            transactionId: '',
          };
          if (currentOrder && currentOrder.id === orderId) {
            setCurrentOrder(updated);
          }

          // Insert into payment history ledger
          const newHistory: PaymentHistoryItem = {
            id: `pay-${Date.now()}`,
            orderId: o.id,
            imei: o.imei,
            ecid: o.ecid,
            amount: o.price || '19.00 USDT',
            transactionId: o.transactionId || '0xSimulatedHashManualRejected',
            status: 'rejected',
            date: new Date().toISOString().replace('T', ' ').substring(0, 19),
            customer: userEmail,
          };
          setPaymentHistory((prev) => [newHistory, ...prev]);

          if (currentUser) {
            syncOrderToFirestore(updated);
            syncPaymentToFirestore(newHistory);
          }

          return updated;
        }
        return o;
      })
    );

    const targetOrder = orders.find(o => o.id === orderId);
    triggerNotification(
      'Payment Rejected',
      'Your payment TxID could not be verified on the BEP20 blockchain ledger. Please try again.',
      'payment',
      'AlertTriangle',
      targetOrder?.userId,
      targetOrder?.email
    );

    addLog('Payment Rejected', `Rejected transaction hash for order ${orderId}`, 'admin_root', 'error');
  };

  // 7. Customer: Request Firmware Link
  const handleRequestFirmwareLink = () => {
    if (!currentOrder) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === currentOrder.id) {
          const updated: DeviceOrder = {
            ...o,
            firmwareRequestStatus: 'requested',
          };
          setCurrentOrder(updated);
          if (currentUser) {
            syncOrderToFirestore(updated);
          }
          return updated;
        }
        return o;
      })
    );

    // Notify administrator
    triggerNotification(
      'Firmware Link Requested',
      `Firmware file requested for Order ID ${currentOrder.id} - IMEI ${currentOrder.imei}.`,
      'firmware',
      'Download'
    );

    addLog('Firmware Requested', `Customer requested restore firmware for Order ${currentOrder.id}`, userEmail, 'info');
    alert('Firmware link requested successfully. The administrator will prepare and send your restore files shortly!');
  };

  // 8. Admin: Deliver / Send Firmware Link
  const handleSendFirmwareLink = (orderId: string, link: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: DeviceOrder = {
            ...o,
            status: 'completed',
            firmwareRequestStatus: 'sent',
            firmwareLink: link,
          };
          if (currentOrder && currentOrder.id === orderId) {
            setCurrentOrder(updated);
          }
          if (currentUser) {
            syncOrderToFirestore(updated);
          }
          return updated;
        }
        return o;
      })
    );

    const targetOrder = orders.find(o => o.id === orderId);
    // Notify customer
    triggerNotification(
      'Firmware Ready',
      'Your custom restore firmware has been prepared and is ready for download.',
      'firmware',
      'Download',
      targetOrder?.userId,
      targetOrder?.email
    );

    addLog('Firmware Sent', `Custom restore link dispatched for Order ${orderId}`, 'admin_root', 'success');
  };

  // Admin Device Checks operations
  const handleUpdateDeviceCheckStatus = async (requestId: string, status: DeviceCheck['currentStatus']) => {
    try {
      const docRef = doc(db, 'deviceChecks', requestId);
      await setDoc(docRef, { currentStatus: status }, { merge: true });
      addLog('Device Check Updated', `Status set to ${status} for Request ${requestId}`, 'admin_root', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `deviceChecks/${requestId}`);
    }
  };

  const handleSendDeviceCheckFeedback = async (
    requestId: string, 
    feedback: string, 
    deviceDetails?: { device: string; supportStatus: string; successRate: string; registrationRequired: string }
  ) => {
    try {
      const docRef = doc(db, 'deviceChecks', requestId);
      const updatePayload: Partial<DeviceCheck> = {
        currentStatus: 'Feedback Sent',
        adminFeedback: feedback,
        reviewedBy: 'iunlockapple1427@gmail.com',
        reviewedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        ...(deviceDetails || {})
      };
      await setDoc(docRef, updatePayload, { merge: true });
      
      addLog('Device Check Feedback Sent', `Feedback dispatched for Request ${requestId}`, 'admin_root', 'success');
      
      const targetCheck = deviceChecks.find(c => c.requestId === requestId);
      // Dispatch alert to user list
      triggerNotification(
        'Device Check Completed',
        `Your compatibility results are now available.`,
        'order',
        'CheckCircle',
        targetCheck?.userId,
        targetCheck?.email
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `deviceChecks/${requestId}`);
    }
  };

  const handleSaveDeviceCheckDraft = async (requestId: string, feedback: string, draftDetails?: any) => {
    try {
      const docRef = doc(db, 'deviceChecks', requestId);
      await setDoc(docRef, { 
        adminFeedback: feedback,
        ...(draftDetails || {})
      }, { merge: true });
      addLog('Device Check Draft Saved', `Draft saved for Request ${requestId}`, 'admin_root', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `deviceChecks/${requestId}`);
    }
  };

  const handleDeleteDeviceCheckRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'deviceChecks', requestId));
      addLog('Device Check Deleted', `Permanently deleted Request ${requestId}`, 'admin_root', 'warning');
    } catch (err) {
      console.warn('Firestore delete device check error:', err);
    }
    setDeviceChecks((prev) => prev.filter((c) => c.requestId !== requestId));
    if (activeDeviceCheckId === requestId) {
      setActiveDeviceCheckId(null);
      localStorage.removeItem('3u_active_device_check_id');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      addLog('Order Deleted', `Permanently deleted order ${orderId}`, 'admin_root', 'warning');
    } catch (err) {
      console.warn('Firestore delete order error:', err);
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (currentOrder?.id === orderId) {
      setCurrentOrder(null);
      localStorage.removeItem('3u_current_order');
    }
  };

  const handleDeleteAllOrders = async () => {
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const deletePromises = snap.docs.map((docSnap) => deleteDoc(doc(db, 'orders', docSnap.id)));
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn('Firestore delete all orders error:', err);
    }
    setOrders([]);
    setCurrentOrder(null);
    localStorage.removeItem('3u_current_order');
    triggerNotification('Orders Cleared', 'All unlock orders have been deleted.', 'order', 'Trash2');
    addLog('All Orders Deleted', 'Permanently deleted all unlock orders', 'admin_root', 'warning');
  };

  const handleDeleteAllDeviceChecks = async () => {
    try {
      const snap = await getDocs(collection(db, 'deviceChecks'));
      const deletePromises = snap.docs.map((docSnap) => deleteDoc(doc(db, 'deviceChecks', docSnap.id)));
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn('Firestore delete all checks error:', err);
    }
    setDeviceChecks([]);
    setActiveDeviceCheckId(null);
    localStorage.removeItem('3u_active_device_check_id');
    addLog('All Device Checks Deleted', 'Permanently deleted all device check submissions', 'admin_root', 'warning');
  };

  // Mark single notification read
  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, read: true };
          if (currentUser) {
            syncNotificationToFirestore(updated);
          }
          return updated;
        }
        return n;
      })
    );
  };

  // Mark all notifications read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        const updated = { ...n, read: true };
        if (currentUser) {
          syncNotificationToFirestore(updated);
        }
        return updated;
      })
    );
  };

  // Clear/delete all notifications from dropdown list
  const handleClearAllNotifications = async () => {
    const toDelete = [...notifications];
    setNotifications([]);
    for (const n of toDelete) {
      try {
        await deleteDoc(doc(db, 'notifications', n.id));
      } catch (e) {
        console.warn("Could not delete notification doc:", e);
      }
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.warn("Could not delete notification doc:", e);
    }
  };

  // Copy-to-clipboard wallet helper
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(adminWallet);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Force simulation shortcut to speed up review testing
  const handleFastForwardSimulation = () => {
    if (!currentOrder) return;
    
    // Jump the active state directly to process completed
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === currentOrder.id) {
          const updated: DeviceOrder = {
            ...o,
            status: 'ready_activation',
            processingProgress: 100,
            processingStage: 'Completed',
          };
          setCurrentOrder(updated);
          if (currentUser) {
            syncOrderToFirestore(updated);
          }
          return updated;
        }
        return o;
      })
    );
    setProcessingTimerActive(false);
    triggerNotification('Order Completed', `SIMULATOR FAST-FORWARD: Order ${currentOrder.id} ready.`, 'order', 'CheckCircle');
    addLog('Simulator Fast-Forward', `Jumped processing progress to 100% for IMEI: ${currentOrder.imei}`, 'system', 'info');
  };

  // Helper helper to format progress percentages
  const getProgressStageColor = (percentage: number) => {
    if (percentage < 25) return 'text-amber-500';
    if (percentage < 50) return 'text-blue-500';
    if (percentage < 80) return 'text-purple-500';
    return 'text-emerald-500';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex flex-col items-center justify-center font-sans">
        <div className="space-y-4 text-center">
          <div className="relative w-14 h-14 mx-auto">
            <svg viewBox="0 0 100 100" className="w-14 h-14 text-[#1E4DFF] animate-spin">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="120" />
            </svg>
          </div>
          <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase animate-pulse">Restoring 3uUnlocks Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="application-root" className="min-h-screen bg-[#F4F6FB] flex flex-col font-sans antialiased text-slate-800">
      
      {/* Header component */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        perspective={perspective}
        setPerspective={setPerspective}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onDeleteNotification={handleDeleteNotification}
        currentUser={currentUser}
        userBalance={profileData?.balance ?? 0}
        onSignIn={() => setActiveTab('login')}
        onSignOut={() => setShowLogoutModal(true)}
        onSelectDropdownItem={(item) => {
          if (item === 'profile') {
            setActiveTab('my-account');
            setAccountSubTab('profile');
          } else if (item === 'my-account') {
            setActiveTab('my-account');
            setAccountSubTab('history');
          } else if (item === 'settings') {
            setActiveTab('my-account');
            setAccountSubTab('settings');
          }
        }}
        onOpenSupport={() => setIsSupportOpen(true)}
        forceOpenNotif={forceOpenNotif}
        onResetForceOpen={() => setForceOpenNotif(false)}
      />

      {/* Main Container Area */}
      <main className="flex-1">
        
        {/* Render ADMIN Panel Workspace */}
        {perspective === 'admin' && isUserAdmin ? (
          <div className="py-8 px-4 max-w-7xl mx-auto space-y-6">
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-sans shadow-md">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>ADMINISTRATOR CONSOLE:</strong> Signed in as Administrator ({currentUser?.email}). Use the controls below to manage orders and system data.
                </span>
              </div>
              <button
                onClick={() => setPerspective('customer')}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
              >
                Customer View
              </button>
            </div>

            <AdminPanel
              orders={orders}
              notifications={notifications}
              activityLogs={activityLogs}
              paymentHistory={paymentHistory}
              deviceChecks={deviceChecks}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
              onSendFirmwareLink={handleSendFirmwareLink}
              onApproveDeviceReview={handleApproveDeviceReview}
              onTriggerNotification={triggerNotification}
              onUpdateDeviceCheckStatus={handleUpdateDeviceCheckStatus}
              onSendDeviceCheckFeedback={handleSendDeviceCheckFeedback}
              onSaveDeviceCheckDraft={handleSaveDeviceCheckDraft}
              onDeleteDeviceCheckRequest={handleDeleteDeviceCheckRequest}
              onDeleteOrder={handleDeleteOrder}
              onDeleteAllOrders={handleDeleteAllOrders}
              onDeleteAllDeviceChecks={handleDeleteAllDeviceChecks}
              userEmail={userEmail}
            />
          </div>
        ) : (
          /* Render CUSTOMER facing workspaces depending on active tab */
          <>
            {currentUser && isUserAdmin && perspective === 'customer' && (
              <div className="bg-[#1E4DFF] text-white py-2.5 px-6 text-xs text-center font-semibold animate-in slide-in-from-top duration-300 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="flex items-center gap-2 text-left">
                    <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                    <span><strong>Administrator Account:</strong> You are currently viewing the customer perspective.</span>
                  </div>
                  <button 
                    onClick={() => { setPerspective('admin'); setActiveTab('home'); }}
                    className="bg-white text-[#1E4DFF] hover:bg-slate-50 font-bold px-3.5 py-1.5 rounded-xl text-[11px] shadow-sm transition cursor-pointer shrink-0"
                  >
                    Go to Admin Console
                  </button>
                </div>
              </div>
            )}

            {!currentUser && activeTab !== 'login' && activeTab !== 'register' && activeTab !== 'forgot-password' && (
              <div className="bg-blue-50/90 border-b border-blue-100/50 text-[#1E4DFF] py-3 px-6 text-xs text-center font-semibold animate-in slide-in-from-top duration-300">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="flex items-center gap-2 text-left">
                    <Database className="w-4 h-4 text-[#1E4DFF] shrink-0 animate-pulse" />
                    <span><strong>Live Sync Active:</strong> Please sign in to register compatibility checks, sync unlock orders, and retrieve custom IPSW activation firmware.</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('login')}
                    className="bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-[11px] shadow-sm transition cursor-pointer shrink-0"
                  >
                    Login to Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'login' && (
              <LoginPage
                onSuccess={() => {
                  const loggedEmail = auth.currentUser?.email?.toLowerCase();
                  if (loggedEmail === 'iunlockapple01@gmail.com' || loggedEmail === 'iunlockapple1427@gmail.com') {
                    setPerspective('admin');
                    setActiveTab('home');
                  } else {
                    setPerspective('customer');
                    setActiveTab('my-account');
                    setAccountSubTab('history');
                  }
                }}
                onNavigateToRegister={() => setActiveTab('register')}
                onNavigateToForgotPassword={() => setActiveTab('forgot-password')}
                onNavigateToHome={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'register' && (
              <RegisterPage
                onSuccess={() => {
                  setActiveTab('login');
                }}
                onNavigateToLogin={() => setActiveTab('login')}
                onNavigateToHome={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'forgot-password' && (
              <ForgotPasswordPage
                onNavigateToLogin={() => setActiveTab('login')}
                onNavigateToHome={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'prices' && (
              <PricesPage onNavigateToHome={() => setActiveTab('home')} />
            )}

            {activeTab === 'my-account' && (
              <MyAccountPage
                orders={orders}
                onSelectOrder={(ord) => {
                  setCurrentOrder(ord);
                  setActiveTab('home');
                }}
                userEmail={userEmail}
                profileData={profileData}
              />
            )}

            {(activeTab === 'terms' || activeTab === 'privacy' || activeTab === 'refund' || activeTab === 'faq') && (
              <PolicyPage
                type={activeTab as PolicyType}
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectPolicy={(pol) => setActiveTab(pol)}
              />
            )}

            {activeTab === 'home' && (
              <div>
                {/* 1. Hero Light Section with Title and iPad Mockup */}
                <div id="hero-workspace" className="pt-16 pb-12 px-6">
                  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left Mockup Panel */}
                    <div className="lg:col-span-5 flex justify-center">
                      <DeviceMockup />
                    </div>

                    {/* Right Hero Content */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Main Heading */}
                      <div className="space-y-3 text-left">
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                          iCloud Activation Lock <br />
                          <span className="text-[#1E4DFF] bg-gradient-to-r from-blue-600 via-[#1E4DFF] to-indigo-600 bg-clip-text text-transparent">Unlock Service</span>
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                          Safely and permanently unlock Apple iCloud Activation Lock screens. Full automated network support for all supported models.
                        </p>
                      </div>

                      {/* Apple exclusively info badge */}
                      <div className="inline-flex items-center gap-2.5 bg-[#E8F0FE] text-[#1E4DFF] text-xs px-4 py-2 rounded-xl border border-blue-100 shadow-sm font-medium">
                        <Info className="w-4 h-4 text-[#1E4DFF] shrink-0" />
                        <span>This service is exclusively for supported Apple iPhones and iPads.</span>
                      </div>

                      {/* MAIN ACTIVE CONTAINER (Transforms based on current order status or active device checks) */}
                      {currentOrder ? (
                        
                        /* SCENARIO B: ACTIVE DEVICE ORDER TRACKING - CHANGER DISPATCH PANEL */
                        <div id="feedback-panel-workspace" className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-xl space-y-6">
                          
                          {/* Heading with Close/Reset Order tracking to test again */}
                          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-mono tracking-wider bg-blue-50 text-[#1E4DFF] font-bold px-2 py-0.5 rounded-full">
                                Active Session Tracker
                              </span>
                              <h2 className="text-lg font-black text-slate-900 flex items-center gap-1.5 pt-1">
                                Order {currentOrder.id} Details 
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                setCurrentOrder(null);
                                setActiveDeviceCheckId(null);
                                localStorage.removeItem('3u_current_order');
                                localStorage.removeItem('3u_active_device_check_id');
                                setImeiInput('');
                                setEcidInput('');
                                setIosInput('');
                                setCheckResult(null);
                              }}
                              className="text-xs text-slate-400 hover:text-red-500 hover:underline cursor-pointer font-medium"
                            >
                              Check another device
                            </button>
                          </div>

                          {/* Display current active step in the flow */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* 1. Technical specs sidebar */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">
                                Device Metadata
                              </h4>
                              
                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">IMEI / SN:</span>
                                  <span className="font-mono text-slate-800 font-bold select-all">{currentOrder.imei}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">ECID Chip:</span>
                                  <span className="font-mono text-slate-800 font-bold select-all">{currentOrder.ecid}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">iOS version:</span>
                                  <span className="text-slate-700 font-bold">v{currentOrder.iosVersion}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200/60 pt-3">
                                  <span className="text-slate-400">Estimate Price:</span>
                                  <span className="text-emerald-600 font-bold">{currentOrder.price || '$19.00 USDT'}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => setShowCheckDetailsModal(true)}
                                className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 font-extrabold text-[11px] py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                              >
                                <Eye className="w-4 h-4 text-[#1E4DFF]" />
                                <span>View Diagnostics Report</span>
                              </button>

                              {/* Quick visual step checklist indicator */}
                              <div className="border-t border-slate-200/60 pt-4 space-y-2.5">
                                <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Workflow Status</h5>
                                <div className="space-y-2 text-[11px] font-semibold">
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px]">✓</span>
                                    <span className="text-slate-500 line-through">Check Device</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                                      currentOrder.status !== 'pending_review' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-[#1E4DFF]'
                                    }`}>
                                      {currentOrder.status !== 'pending_review' ? '✓' : '•'}
                                    </span>
                                    <span className={currentOrder.status !== 'pending_review' ? 'text-slate-500 line-through' : 'text-[#1E4DFF]'}>
                                      Server Report
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                                      (currentOrder.status !== 'pending_review' && currentOrder.status !== 'waiting_payment' && currentOrder.status !== 'verifying_payment') ? 'bg-emerald-100 text-emerald-600' : 
                                      (currentOrder.status === 'waiting_payment' || currentOrder.status === 'verifying_payment') ? 'bg-blue-100 text-[#1E4DFF]' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {currentOrder.status === 'verifying_payment' ? '•' : 
                                       (currentOrder.status !== 'pending_review' && currentOrder.status !== 'waiting_payment' && currentOrder.status !== 'verifying_payment') ? '✓' : '•'}
                                    </span>
                                    <span className={
                                      currentOrder.status === 'waiting_payment' || currentOrder.status === 'verifying_payment' ? 'text-[#1E4DFF] font-extrabold' : 
                                      (currentOrder.status !== 'pending_review' && currentOrder.status !== 'waiting_payment' && currentOrder.status !== 'verifying_payment') ? 'text-slate-500 line-through' : 'text-slate-400'
                                    }>
                                      Make Payment
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                                      currentOrder.status === 'completed' || currentOrder.status === 'ready_activation' ? 'bg-emerald-100 text-emerald-600' :
                                      currentOrder.status === 'processing' ? 'bg-blue-100 text-[#1E4DFF] animate-pulse' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {currentOrder.status === 'completed' || currentOrder.status === 'ready_activation' ? '✓' : '•'}
                                    </span>
                                    <span className={
                                      currentOrder.status === 'processing' ? 'text-[#1E4DFF] font-extrabold' : 
                                      currentOrder.status === 'completed' || currentOrder.status === 'ready_activation' ? 'text-slate-500 line-through' : 'text-slate-400'
                                    }>
                                      Processing Unlock
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                                      currentOrder.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                                      currentOrder.status === 'ready_activation' ? 'bg-blue-100 text-[#1E4DFF] animate-pulse' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                      {currentOrder.status === 'completed' ? '✓' : '•'}
                                    </span>
                                    <span className={
                                      currentOrder.status === 'ready_activation' ? 'text-[#1E4DFF] font-extrabold' :
                                      currentOrder.status === 'completed' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'
                                    }>
                                      Activation Ready
                                    </span>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* 2. Main workflow display card */}
                            <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
                              
                              {/* STAGE DISPATCHER */}

                              {/* A. WAITING FOR ADMIN ELIGIBILITY REVIEW */}
                              {currentOrder.status === 'pending_review' && (
                                <div className="space-y-4">
                                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-5 h-5 text-amber-500 animate-spin" />
                                      <h3 className="font-bold text-slate-900 text-sm">Under Administrator Review</h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                      Your device registered details have been submitted to our administrative queue. 
                                      The administrator is checking compatibility with our server nodes.
                                    </p>
                                  </div>

                                  <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/30 text-xs">
                                    <h4 className="font-bold text-[#1E4DFF] mb-1">Status:</h4>
                                    <p className="text-slate-600">
                                      The administrator will review your device details and approve this request shortly.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* B. WAITING FOR PAYMENT (or verifying payment) */}
                              {(currentOrder.status === 'waiting_payment' || currentOrder.status === 'verifying_payment') && (
                                <div className="space-y-4">
                                  
                                  {/* 1. Server report display */}
                                  <div className="bg-blue-50/55 rounded-2xl p-5 border border-blue-100/30 space-y-3">
                                    <span className="text-[10px] font-bold text-[#1E4DFF] uppercase tracking-wider font-mono">
                                      Server Report
                                    </span>
                                    <p className="text-sm font-bold text-slate-800 leading-normal">
                                      &ldquo;{currentOrder.adminFeedback || 'Your device is supported. Please restore using the firmware provided after payment.'}&rdquo;
                                    </p>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-blue-100/30 pt-2">
                                      <span>Reviewed on: {currentOrder.feedbackDate || 'Today'}</span>
                                      <span className="font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100/50">
                                        Current Status: Waiting For Payment
                                      </span>
                                    </div>
                                  </div>

                                  {/* 2. Actions button or awaiting admin verification text */}
                                  {currentOrder.status === 'waiting_payment' ? (
                                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                                      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                                        <CreditCard className="w-5 h-5 text-[#1E4DFF]" />
                                        <h4 className="font-bold text-slate-900 text-sm">Register Device Serial Node</h4>
                                      </div>
                                      
                                      <div className="space-y-2 text-xs">
                                        <p className="text-slate-500 font-medium">
                                          Please send exactly <span className="font-extrabold text-slate-800">{currentOrder.price || '$19.00 USDT'}</span> to the following cryptocurrency address. Once complete, submit your hash or click verify.
                                        </p>
                                        
                                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2.5 shadow-sm">
                                          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-mono font-bold">
                                            <span>USDT (BEP20 Address)</span>
                                            <span className="text-[#1E4DFF]">100% Secure</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 flex-1 truncate select-all">
                                              {adminWallet}
                                            </span>
                                            <button 
                                              onClick={() => {
                                                navigator.clipboard.writeText(adminWallet);
                                                alert('Payment address copied to clipboard!');
                                              }}
                                              className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-slate-600 transition-colors shrink-0 cursor-pointer"
                                              title="Copy Address"
                                            >
                                              <Copy className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex gap-3">
                                        <button
                                          onClick={() => setIsPaymentModalOpen(true)}
                                          className="flex-1 bg-[#1E4DFF] hover:bg-blue-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shadow shadow-blue-500/10 flex items-center justify-center gap-1.5"
                                        >
                                          <ShieldCheck className="w-4 h-4" /> Verify Payment
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-blue-50 border border-blue-100/50 rounded-2xl p-5 space-y-3">
                                      <div className="flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 text-[#1E4DFF] animate-spin" />
                                        <h4 className="font-bold text-slate-900 text-sm">Verifying Blockchain Node Status</h4>
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed">
                                        Our server is checking the BEP20 blockchain for the transaction. This takes between 1-5 minutes. Please do not close this session.
                                      </p>
                                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100/30 text-[11px]">
                                        <h5 className="font-bold text-[#1E4DFF] mb-0.5">Verification:</h5>
                                        <p className="text-slate-500">
                                          Payment receipts are verified by the administrator in real time.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              )}

                              {/* C. PROCESSING UNLOCK ON SERVER NODES */}
                              {currentOrder.status === 'processing' && (
                                <div className="space-y-4">
                                  <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/30 text-center space-y-4">
                                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                                      <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                      <div className="absolute inset-0 border-4 border-t-[#1E4DFF] rounded-full animate-spin"></div>
                                      <Cpu className="w-6 h-6 text-[#1E4DFF]" />
                                    </div>
                                    
                                    <div className="space-y-1 max-w-sm mx-auto">
                                      <h3 className="font-bold text-slate-900 text-sm">Server Unlock In Progress</h3>
                                      <p className="text-xs text-slate-500 leading-normal">
                                        We are broadcasting activation unlock commands to the Apple FMI server nodes. 
                                        This can take 2-4 minutes.
                                      </p>
                                    </div>

                                    {/* Progress percentage slider */}
                                    <div className="space-y-1.5 max-w-xs mx-auto">
                                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                        <span>NODES COMPLETED</span>
                                        <span className="font-bold text-blue-600">{currentOrder.processingProgress !== undefined ? currentOrder.processingProgress : 0}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-blue-400 to-[#1E4DFF] rounded-full transition-all duration-500" 
                                          style={{ width: `${currentOrder.processingProgress !== undefined ? currentOrder.processingProgress : 0}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 text-left">
                                    💡 <strong>Developer Note:</strong> This progress completes automatically every few seconds. Once it hits 100%, the FMI-OFF state is written, and custom firmware download links are provisioned!
                                  </div>
                                </div>
                              )}

                              {/* D. WORKFLOW COMPLETED (FMI OFF GUARANTEED) AND CUSTOM FIRMWARE ACTIVE */}
                              {(currentOrder.status === 'completed' || currentOrder.status === 'ready_activation') && (
                                <div className="space-y-4">
                                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                      <h3 className="font-bold text-slate-900 text-sm">FMI OFF Status Guaranteed</h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                      Congratulations! The Find My iPhone (FMI) Lock state has been permanently set to <strong>OFF</strong> on the Apple activation database. 
                                      Your device is ready to be restored and configured with any personal Apple ID!
                                    </p>
                                  </div>

                                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                                      <Download className="w-5 h-5 text-emerald-600" />
                                      <h4 className="font-bold text-slate-900 text-sm">Download Authorized Custom Firmware</h4>
                                    </div>

                                    <p className="text-xs text-slate-500 leading-normal">
                                      Your device signature requires the following localized unlock payload. Restoring using this IPSW firmware overrides local caches and initiates signal broadcast.
                                    </p>

                                    <div className="flex flex-wrap items-center gap-3">
                                      {currentOrder.firmwareUrl ? (
                                        <a
                                          href={currentOrder.firmwareUrl}
                                          download
                                          className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-extrabold shadow flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                          <Download className="w-4 h-4" /> Download Firmware
                                        </a>
                                      ) : (
                                        <button
                                          onClick={handleRequestFirmwareLink}
                                          disabled={currentOrder.firmwareRequestStatus === 'requested'}
                                          className="flex-1 sm:flex-initial bg-[#1E4DFF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-extrabold shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                        >
                                          <Download className="w-4 h-4" /> 
                                          <span>
                                            {currentOrder.firmwareRequestStatus === 'requested' ? 'Requested...' : 'Generate Firmware Link'}
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Simulation Helper */}
                                  {currentOrder.firmwareRequestStatus === 'requested' && (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/30 text-xs font-medium text-slate-600">
                                      The administrator will generate and upload your custom IPSW firmware download link shortly.
                                    </div>
                                  )}
                                </div>
                              )}

                            </div>

                          </div>

                        </div>
                      ) : activeCheck ? (
                        <DeviceCheckWorkflow
                          currentCheck={activeCheck}
                          onRetry={() => {
                            setActiveDeviceCheckId(null);
                            localStorage.removeItem('3u_active_device_check_id');
                            setImeiInput('');
                            setEcidInput('');
                            setIosInput('');
                            setCheckResult(null);
                          }}
                          onMakePayment={() => handleMakePaymentForCheck(activeCheck)}
                          onGenerateFirmware={() => {
                            setIsInstructionsOpen(true);
                          }}
                          onCloseCheck={() => {
                            setActiveDeviceCheckId(null);
                            localStorage.removeItem('3u_active_device_check_id');
                            setImeiInput('');
                            setEcidInput('');
                            setIosInput('');
                            setCheckResult(null);
                          }}
                        />
                      ) : (
                        /* SCENARIO A: NO ACTIVE ORDER - DISPLAY CHIPS COMPATIBILITY CHECKER */
                        <div id="device-checker-form" className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6">
                          
                          {/* Form Header */}
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2.5">
                              <h2 className="text-xl font-bold text-slate-900">Check Your Device</h2>
                              <span className="bg-[#1E4DFF]/10 text-[#1E4DFF] text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                                100% Free
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs font-medium">Enter your device details to check compatibility.</p>
                          </div>

                          {/* Checker inputs form */}
                          <form onSubmit={handleCheckDevice} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                              
                              {/* IMEI / SN Field */}
                              <div className="sm:col-span-2 space-y-1.5 text-left">
                                <label className="text-xs font-bold text-slate-600 block pl-1">IMEI or Serial Number</label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3.5 text-slate-400 font-bold text-xs">#</span>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Enter IMEI or Serial Number"
                                    value={imeiInput}
                                    onChange={(e) => setImeiInput(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                                  />
                                </div>
                              </div>

                              {/* ECID Field */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-xs font-bold text-slate-600 block pl-1">ECID</label>
                                <div className="relative flex items-center">
                                  <Cpu className="absolute left-3.5 w-4 h-4 text-slate-400" />
                                  <input
                                    type="text"
                                    required
                                    placeholder="Enter ECID"
                                    value={ecidInput}
                                    onChange={(e) => setEcidInput(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                                  />
                                </div>
                              </div>

                              {/* iOS Version Field */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-xs font-bold text-slate-600 block pl-1">iOS Version</label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3.5 text-[9px] font-bold text-slate-400 border border-slate-300 rounded px-1 py-0.5 leading-none bg-slate-50">iOS</span>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. 17.4.1"
                                    value={iosInput}
                                    onChange={(e) => setIosInput(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium shadow-sm"
                                  />
                                </div>
                              </div>

                              {/* Submit and Download buttons */}
                              <div className="sm:col-span-2 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                  type="submit"
                                  disabled={isChecking}
                                  className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
                                >
                                  {isChecking ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      <span className="truncate">{checkingStep || "Checking..."}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Search className="w-4 h-4" />
                                      <span>CHECK DEVICE</span>
                                    </>
                                  )}
                                </button>

                                <a
                                  href="https://www.3utools.com/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full bg-[#E8F0FE] hover:bg-blue-100 text-[#1E4DFF] border border-blue-200 font-bold text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-center"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>DOWNLOAD 3UTOOLS</span>
                                </a>
                              </div>

                            </div>

                            {/* Bottom Actions Row */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-slate-100">
                              
                              {/* Checkmarks list */}
                              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-600 font-semibold text-left">
                                <span className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-[#1E4DFF] bg-blue-50 rounded-full p-0.5 shrink-0" />
                                  <span>Free Check</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-[#1E4DFF] bg-blue-50 rounded-full p-0.5 shrink-0" />
                                  <span>Instant Results</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-[#1E4DFF] bg-blue-50 rounded-full p-0.5 shrink-0" />
                                  <span>No Registration</span>
                                </span>
                              </div>

                              {/* Download 3uTools Link */}
                              <a 
                                href="https://www.3utools.com/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#1E4DFF] hover:underline font-bold flex items-center gap-1 whitespace-nowrap"
                              >
                                <span>Get 3uTools for Windows</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </a>

                            </div>

                            {/* Unlock Fee Policy Card */}
                            <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-left shadow-sm">
                              <div className="p-2 bg-blue-100 text-[#1E4DFF] rounded-xl shrink-0 mt-0.5">
                                <Info className="w-4 h-4" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-[#1E4DFF] text-xs">Unlock Fee Policy</h4>
                                <p className="text-slate-600 text-xs leading-relaxed">
                                  Unlock fees are deducted from your account balance only after your unlock has been completed successfully. No fee is charged for unsuccessful unlock attempts.
                                </p>
                              </div>
                            </div>

                          </form>

                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* 3. Static Info/Trust Features grid */}
                <div className="max-w-7xl mx-auto px-6 pb-12 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Feature 1 */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#EBF0FF] text-[#1E4DFF] flex items-center justify-center shrink-0">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">Supported Devices</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">iPhones & iPads only<br />All models supported</p>
                      </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#EBF0FF] text-[#1E4DFF] flex items-center justify-center shrink-0">
                        <Cloud className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">Clean & Lost</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Both supported<br />Clean and Lost devices</p>
                      </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#EBF0FF] text-[#1E4DFF] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">Permanent Unlock</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">FMI OFF Guaranteed<br />Official server unlock</p>
                      </div>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#EBF0FF] text-[#1E4DFF] flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">Order Tracking</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Real-time updates<br />Track your order progress</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* Footer component */}
      <Footer 
        onNavigate={(tab) => { setActiveTab(tab); setPerspective('customer'); }} 
        serverVersion="1.6" 
        serverStatus={serverStatus} 
      />

      {/* --- PAYMENT MODAL WINDOW --- */}
      {isPaymentModalOpen && currentOrder && (
        <div 
          id="payment-modal" 
          className="fixed inset-0 bg-slate-950/65 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        >
          <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#1E4DFF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">Payment Details</h3>
              </div>
              {paymentVerificationStage === 'idle' && (
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal body based on verification stage */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {paymentVerificationStage === 'idle' ? (
                <>
                  {/* Currency stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">Blockchain Network</span>
                      <span className="font-extrabold text-slate-800 text-xs">BEP20 (USDT)</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">USDT Amount</span>
                      <span className="font-black text-emerald-600 text-xs">{currentOrder.price || '19.00 USDT'}</span>
                    </div>
                  </div>

                  {/* Wallet address card */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Administrator BEP20 Wallet</span>
                    <div className="bg-slate-900 rounded-xl p-3 text-slate-100 flex items-center justify-between gap-2 border border-slate-800 font-mono">
                      <span className="break-all select-all font-semibold text-[11px] leading-tight pr-1">
                        {adminWallet}
                      </span>
                      <button
                        onClick={handleCopyAddress}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition shrink-0 cursor-pointer"
                        title="Copy Wallet Address"
                      >
                        {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    {copiedAddress && (
                      <span className="text-[10px] text-emerald-600 font-semibold block text-right">
                        ✓ Wallet Address Copied!
                      </span>
                    )}
                  </div>

                  {/* Transaction ID hash input */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700 block">Blockchain Transaction Hash (TxID)</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 64-char transaction hash..."
                      value={paymentTxId}
                      onChange={(e) => setPaymentTxId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-[#1E4DFF]"
                    />
                    <span className="text-[10px] text-slate-400 leading-normal block">
                      Paste the transaction hash of your BEP20 USDT deposit transfer below. We verify every ledger entry.
                    </span>
                  </div>

                  {/* Button action */}
                  <button
                    onClick={handleVerifyPayment}
                    className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-extrabold py-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <span>Verify Payment</span>
                  </button>
                </>
              ) : (
                /* ANIMATION SEQUENCE DISPLAY */
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                  
                  {/* Custom spinning animation */}
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#1E4DFF] border-r-[#1E4DFF] animate-spin" />
                    <div className="absolute inset-4 bg-blue-50 rounded-full flex items-center justify-center text-[#1E4DFF]">
                      <Cpu className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 uppercase font-mono">
                      {paymentVerificationStage === 'uploading' && 'Uploading transaction...'}
                      {paymentVerificationStage === 'blockchain' && 'Checking blockchain...'}
                      {paymentVerificationStage === 'confirming' && 'Confirming payment...'}
                      {paymentVerificationStage === 'submitted' && 'Payment Submitted!'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs leading-normal">
                      {paymentVerificationStage === 'uploading' && 'Uploading your transaction hash to verification queues.'}
                      {paymentVerificationStage === 'blockchain' && 'Syncing database block records with BEP20 ledger nodes.'}
                      {paymentVerificationStage === 'confirming' && 'Awaiting cryptographic signature counts and receipts.'}
                      {paymentVerificationStage === 'submitted' && 'Your payment hash has been logged. Admin verification will process.'}
                    </p>
                  </div>

                  <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-[11px] text-slate-600 font-mono">
                    <span className="font-bold text-slate-400 uppercase tracking-widest block text-[9px] mb-1">NETWORK RESPONSE</span>
                    <span className="font-semibold text-slate-800">
                      {paymentVerificationStage === 'uploading' && 'CONNECTING_SERVER_OK'}
                      {paymentVerificationStage === 'blockchain' && 'LEDGER_QUERY_PING_80MS'}
                      {paymentVerificationStage === 'confirming' && 'WAITING_SIGS_2_OF_3'}
                      {paymentVerificationStage === 'submitted' && 'PENDING_ADMIN_VERIFICATION'}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- INSTRUCTIONS MODAL --- */}
      {isInstructionsOpen && (
        <div className="fixed inset-0 bg-slate-950/65 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-slate-700">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800">
                <BookOpen className="w-4 h-4 text-[#1E4DFF]" />
                <span className="font-bold text-sm">Unlock Activation Connection Instructions</span>
              </div>
              <button
                onClick={() => setIsInstructionsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs leading-relaxed">
              <p>Please follow these steps exactly using your customized restore firmware file:</p>
              
              <ol className="space-y-3 list-decimal pl-4 font-medium text-slate-600">
                <li>
                  Ensure you have downloaded the latest version of <a href="https://www.3utools.com/" target="_blank" rel="noreferrer" className="text-[#1E4DFF] hover:underline font-bold">3uTools for Windows</a>.
                </li>
                <li>
                  Plug your iPhone or iPad into your computer using an official Apple lightning / USB-C data cable.
                </li>
                <li>
                  Put your device into <strong>DFU Restore Mode</strong> (Press power + volume buttons based on your model configuration).
                </li>
                <li>
                  Open 3uTools, navigate to the <strong>Go Flash</strong> tab, select <strong>Pro Flash</strong>, click <strong>Import</strong>, and select the downloaded `.ipsw` customized restore firmware file.
                </li>
                <li>
                  Click <strong>Flash</strong>. Ensure you do NOT unplug the device while flash logs complete.
                </li>
                <li>
                  Once complete, your device will reboot directly to the Home screen with iCloud Activation Lock fully unlocked!
                </li>
              </ol>

              <div className="bg-blue-50 text-[#1E4DFF] p-3.5 rounded-xl border border-blue-100/30 font-semibold text-[11px]">
                ⚠️ Note: Do not restore standard firmware OTA after unlock. The custom signature prevents activation lock loops permanently unless wiped.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsInstructionsOpen(false)}
                className="bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop blur */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutModal(false)}></div>
          
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-[24px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md p-6 sm:p-8 space-y-6 border border-slate-100 animate-in zoom-in duration-300">
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  Log Out
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                  Are you sure you want to sign out?
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowLogoutModal(false);
                    try {
                      await signOut(auth);
                      setActiveTab('home');
                    } catch (err) {
                      console.error('Sign out failed:', err);
                    }
                  }}
                  className="bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Log Out
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Diagnostics / Compatibility Report Details Modal */}
      {showCheckDetailsModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCheckDetailsModal(false)} />
          <div className="relative bg-white rounded-[24px] p-6 sm:p-8 max-w-2xl w-full border border-slate-100 shadow-2xl z-50 space-y-6 text-left animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-150 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">
                  Compatibility Report
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Full Diagnostics & Verification Details
                </h3>
              </div>
              <button
                onClick={() => setShowCheckDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200 p-1.5 rounded-lg cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Table layout exactly like the diagnostics popup */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">
                Device Specifications & Verification Results
              </h4>
              
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100/80 bg-slate-100/35">
                      <th className="text-left py-2.5 px-4 font-semibold text-slate-500 font-mono text-[10px]">FIELD</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-slate-500 font-mono text-[10px]">VALUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">Device Model</td>
                      <td className="py-2.5 px-4 text-slate-900 font-extrabold">{currentOrder.device || 'iPhone / iPad (Standard)'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">IMEI / Serial Number</td>
                      <td className="py-2.5 px-4 text-slate-900 font-mono font-bold select-all">{currentOrder.imei}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">ECID</td>
                      <td className="py-2.5 px-4 text-slate-900 font-mono font-bold select-all">{currentOrder.ecid}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">iOS Version</td>
                      <td className="py-2.5 px-4 text-slate-900 font-bold">v{currentOrder.iosVersion}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">Success Rate</td>
                      <td className="py-2.5 px-4 text-emerald-600 font-extrabold">{currentOrder.successRate || '98.4%'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">Unlock Price</td>
                      <td className="py-2.5 px-4 text-[#1E4DFF] font-black font-mono">
                        {currentOrder.price || '$19.00 USDT'}
                      </td>
                    </tr>
                    
                    {/* Additional fields from matching DeviceCheck in Firestore */}
                    {(() => {
                      const matchedCheck = deviceChecks.find(c => c.imeiSerial === currentOrder?.imei);
                      if (!matchedCheck) return null;
                      return (
                        <>
                          {matchedCheck.fmiStatus && (
                            <tr>
                              <td className="py-2.5 px-4 text-slate-400 font-medium">FMI Status</td>
                              <td className="py-2.5 px-4 text-slate-700 font-bold">
                                {matchedCheck.fmiStatus}
                              </td>
                            </tr>
                          )}
                          {matchedCheck.currentStatus && (
                            <tr>
                              <td className="py-2.5 px-4 text-slate-400 font-medium">Compatibility Status</td>
                              <td className="py-2.5 px-4">
                                <span className="font-extrabold uppercase text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-md">
                                  {matchedCheck.currentStatus}
                                </span>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })()}

                    {/* Server report / details header */}
                    <tr className="bg-slate-100/35 border-y border-slate-100">
                      <td colSpan={2} className="py-2.5 px-4 text-[#1E4DFF] font-bold uppercase tracking-wider text-[10px] font-mono">
                        Unlock Server Report
                      </td>
                    </tr>

                    {/* Admin feedback parser */}
                    {(() => {
                      const matchedCheck = deviceChecks.find(c => c.imeiSerial === currentOrder?.imei);
                      const feedbackText = matchedCheck?.adminFeedback || 'Your device has been reviewed. Support has been verified successfully. Please proceed with payment.';
                      const parsed = parseFeedbackTextInApp(feedbackText);
                      
                      return parsed.map((item, index) => {
                        const isCode = item.key.toLowerCase().includes('imei') || 
                                       item.key.toLowerCase().includes('serial') || 
                                       item.key.toLowerCase().includes('ecid') || 
                                       item.key.toLowerCase().includes('model');
                        return (
                          <tr key={index}>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">
                              {item.key}
                            </td>
                            <td className={`py-2.5 px-4 text-slate-900 font-bold ${isCode ? 'font-mono select-all' : ''}`}>
                              {item.val}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setShowCheckDetailsModal(false)}
              className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs py-3.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10 text-center"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Existing Order Error Modal (Unlock Activity Ledger Duplicate Guard) */}
      {existingOrderErrorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setExistingOrderErrorModal({ isOpen: false, order: null, imeiSerial: '' })}
          />
          <div className="relative bg-white rounded-[24px] p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl z-50 space-y-5 text-left animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full">
                    Unlock Activity Ledger
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                    Order Already Exists
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setExistingOrderErrorModal({ isOpen: false, order: null, imeiSerial: '' })}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200 p-1.5 rounded-lg cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message Notice */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-2.5 text-xs text-amber-950">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-950 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Existing Order On Unlock Ledger</span>
              </div>
              <p className="leading-relaxed text-slate-800">
                You have already placed an order for this device (IMEI / Serial: <strong className="font-mono text-slate-900">{existingOrderErrorModal.imeiSerial}</strong>) which is active on the <strong className="text-amber-950">Unlock Activity Ledger</strong>.
              </p>
              <div className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-sm text-slate-800 space-y-1">
                <span className="font-bold text-[#1E4DFF] block">Next Step Required:</span>
                <p className="leading-relaxed font-medium">
                  Please deposit funds into your account balance so that your order can be processed automatically by our unlock server.
                </p>
              </div>
            </div>

            {/* Existing Order Details */}
            {existingOrderErrorModal.order && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-bold uppercase">
                  <span>Order Reference</span>
                  <span className="text-[#1E4DFF] font-extrabold">{existingOrderErrorModal.order.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">IMEI / SERIAL</span>
                    <span className="font-mono font-bold text-slate-900 select-all">{existingOrderErrorModal.order.imei}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">ORDER STATUS</span>
                    <span className="font-extrabold text-blue-600 uppercase text-[10px] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {existingOrderErrorModal.order.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  setExistingOrderErrorModal({ isOpen: false, order: null, imeiSerial: '' });
                  setActiveTab('my-account');
                }}
                className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Deposit to Account</span>
              </button>
              <button
                onClick={() => {
                  if (existingOrderErrorModal.order) {
                    setCurrentOrder(existingOrderErrorModal.order);
                    setActiveDeviceCheckId(null);
                  }
                  setExistingOrderErrorModal({ isOpen: false, order: null, imeiSerial: '' });
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
              >
                <Eye className="w-4 h-4" />
                <span>View Existing Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentUser && perspective === 'customer' && (
        <SupportWidget 
          currentUser={currentUser}
          userEmail={currentUser.email || ''}
          onNavigateToTab={(tab) => {
            setActiveTab(tab);
          }}
          isOpen={isSupportOpen}
          setIsOpen={setIsSupportOpen}
        />
      )}

    </div>
  );
}

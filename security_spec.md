# Firestore Security Specification

This document outlines the security invariants, validation rules, and threat models for the iCloud Bypass Service database.

## 1. Data Invariants
- **Authentication**: All read and write operations require valid authentication.
- **DeviceOrder Integrity**: 
  - An order can only be created with an IMEI and ECID matching standard format.
  - Users can only read and write their own orders.
  - Admins can read and write all orders.
- **System Logs**: Can only be created by users/admins, but cannot be modified or deleted.
- **Notifications**: Users can read global or personal notifications, but cannot modify notifications except marking them as read.

## 2. Threat Vector Payloads ("Dirty Dozen")
Below are 12 specific payloads attempting to violate security boundaries:

1. **Spoofed Order Owner**: Creating an order with another user's UID to view or manage their status.
2. **Ghost Keys Injection**: Adding unverified status or administrative properties (`isVerified`, `adminFeedback`, `price`) during initial order placement.
3. **Invalid IMEI Format**: Injecting standard SQL-injection patterns or extremely long garbage strings in place of IMEI numbers.
4. **Invalid ECID Format**: Attempting to poison ECID values with malicious scripts.
5. **Privilege Escalation**: Attempting to flag an account as an administrator in the database.
6. **Bypassing Payment Verification**: Manually updating payment status directly to `approved` via client SDK.
7. **Modifying Inactive Order State**: Updating an order which is already in terminal `completed` status.
8. **Malicious System Log Creation**: Injecting false activity logs with fake user details to confuse administrators.
9. **Log Deletion**: Attempting to wipe database traces by deleting audit logs.
10. **Notification Hijacking**: Creating spam global notifications to be shown to other clients.
11. **Query Scraping (Blanket Reads)**: Requesting a full list of orders from the collection without specifying the customer filter.
12. **Tampering with Timestamps**: Sending a manual client-side timestamp in `createdAt` to simulate old transactions.

## 3. Firestore Security Rules Target
We will map these requirements to our secure `firestore.rules` file to mathematically guarantee rejection of all "Dirty Dozen" attack vectors.

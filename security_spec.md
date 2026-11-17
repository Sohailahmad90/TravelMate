# TravelMate Security Specification & Red-Team TDD

## 1. Data Invariants
1. **Role & Admin Elevation Prevention**: No user may create a `/users/{userId}` document with `role == "admin"` or `isSuspended == true`, nor escalate their own `role` during updates.
2. **PII & CNIC Isolation**: `/users/{userId}` and `/guideVerifications/{guideId}` contain sensitive PII (`email`, `phone`, `cnicNumber`, `address`). Reads are strictly restricted to the owning UID or verified Admin (`request.auth.token.email_verified == true`).
3. **Guide Verification Integrity**: A tour guide cannot self-mark `verificationStatus = "verified"` on `/guides/{guideId}` or `/guideVerifications/{guideId}`, and cannot publish a `/packages/{packageId}` (`isPublished == true`) unless their guide profile has `verificationStatus == "verified"` (or Admin override).
4. **Booking Ownership & Payment Lock**: `/bookings/{bookingId}` can only be read by `touristUid`, `providerUid`, or Admin. Initial `bookingStatus` must be `"pending"`, and `paymentStatus` must remain `"not_required_yet"` or `"coming_soon"` (no fake paid states).
5. **Completed-Booking Review Guard**: A `/reviews/{reviewId}` document can only be created by `authorUid == request.auth.uid` if the referenced `bookingId` exists, belongs to that tourist, and has `bookingStatus == "completed"`.
6. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps on client writes must match `request.time`.

## 2. Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Self-Admin Escalation**: Creating `/users/{uid}` with `role: "admin"` -> DENIED.
2. **Shadow Field Injection**: Creating `/users/{uid}` with extra key `shadowVip: true` -> DENIED.
3. **Cross-User PII Read**: Non-owner reading `/guideVerifications/guide_1` -> DENIED.
4. **Guide Self-Verification**: Guide updating `/guides/{guideId}` `verificationStatus` to `"verified"` -> DENIED.
5. **Unverified Package Publish**: Unverified guide creating `/packages/{pkgId}` with `isPublished: true` -> DENIED.
6. **Oversized ID Poisoning**: Creating `/bookings/{200-char-id}` or invalid characters `$bad!` -> DENIED.
7. **Unverified Email Admin Spoof**: Token with admin email and `email_verified: false` attempting admin write -> DENIED.
8. **Blanket Message Scraping**: Third-party user listing `/messages` without `request.auth.uid in resource.data.participants` -> DENIED.
9. **Spoofed Sender Message**: Creating `/messages/{id}` with `senderUid` set to another user's UID -> DENIED.
10. **Fake Review Injection**: Creating `/reviews/{id}` referencing a `pending` booking -> DENIED.
11. **Terminal Booking Mutation**: Tourist updating a `completed` booking back to `pending` -> DENIED.
12. **Client Timestamp Forgery**: Creating `/travelPlans/{id}` with `createdAt` set to a fake past timestamp instead of `request.time` -> DENIED.

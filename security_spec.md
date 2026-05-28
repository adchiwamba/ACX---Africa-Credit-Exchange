# Firebase Security Specification

## Data Invariants
- A User profile can only be created by the user themselves (UID match) or an admin.
- A User can only read/update their own profile.
- Loans can be created by Borrowers.
- Loans can be read by the Borrower who created it, or Lenders (to fund), or Admins.
- Investments can be created by Lenders.
- Repayments are linked to Loans and can be read by the Loan Borrower and Lender.
- Audit logs are system-generated (or user-triggered) and mainly read by Admins.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing (User Profile)**: Attempt to create a user profile with a UID that doesn't match the auth UID.
2. **Role Escalation**: A Borrower attempts to update their role to 'ADMIN'.
3. **Ghost Field Injection**: Adding `isVerified: true` to a profile during a regular profile update.
4. **Unauthorized Loan Access**: A Borrower attempts to read another Borrower's loan.
5. **Loan State Shortcutting**: A Borrower attempts to update a Loan status from 'PENDING' to 'APPROVED'.
6. **Balance Manipulation**: A user attempts to directly increment their `balance` field without a verified transaction (not fully preventable by rules if balance is updated client-side, but we can restrict who updates it).
7. **Orphaned Loan**: Creating a loan with a `borrowerId` that doesn't match the auth UID.
8. **Malicious ID**: Creating a document with a 1MB string as the ID.
9. **Timestamp Spoofing**: Providing a `createdAt` date from the past in the payload instead of using server time (if we were using server time enforcements).
10. **Unauthorized Investment**: A Borrower attempts to create an investment entry.
11. **Repayment Tampering**: A Borrower attempts to mark a repayment as 'PAID' without actual payment (should be system-only or admin-only).
12. **Audit Log Erasure**: Any non-admin user attempts to delete an audit log.

## Test Runner (Conceptual)
All payloads above should return `PERMISSION_DENIED`.

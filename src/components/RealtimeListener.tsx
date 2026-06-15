import React, { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from './FirebaseProvider';
import { useNotify } from '../lib/NotificationContext';
import { LoanRequest, LoanStatus, Repayment, UserRole } from '../types';

export const RealtimeListener: React.FC = () => {
  const { profile: user } = useFirebase();
  const { notify } = useNotify();

  // Keep track of active loans and their previous states to prevent redundant alerts
  const prevLoans = useRef<Record<string, LoanRequest>>({});
  const prevRepayments = useRef<Record<string, Repayment>>({});

  useEffect(() => {
    if (!user) {
      prevLoans.current = {};
      prevRepayments.current = {};
      return;
    }

    // 1. Subscribe to relevant Loans
    let loansQuery;
    if (user.role === UserRole.BORROWER) {
      loansQuery = query(
        collection(db, 'loans'),
        where('borrowerId', '==', user.uid)
      );
    } else if (user.role === UserRole.LENDER || user.role === UserRole.INVESTOR) {
      loansQuery = query(
        collection(db, 'loans'),
        where('lenderId', '==', user.uid)
      );
    } else {
      // Admin/Bank/Retailer can listen to all loans
      loansQuery = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    }

    let isLoansInitial = true;

    const unsubscribeLoans = onSnapshot(
      loansQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const docData = { id: change.doc.id, ...change.doc.data() } as LoanRequest;

          if (change.type === 'added') {
            prevLoans.current[docData.id] = docData;

            // Optional: toast notify on new loan applications for non-borrowers (e.g., Lenders seeing a new application)
            if (!isLoansInitial && change.type === 'added') {
              if (user.role !== UserRole.BORROWER && docData.status === LoanStatus.PENDING) {
                notify(
                  'info',
                  'New Loan Application 📝',
                  `A new micro-credit request of ${docData.currency} ${docData.amount.toLocaleString()} is pending verification.`
                );
              } else if (user.role === UserRole.BORROWER && docData.status === LoanStatus.PENDING) {
                notify(
                  'success',
                  'Corridor Opened 🔐',
                  `Your loan application for ${docData.currency} ${docData.amount.toLocaleString()} has been submitted.`
                );
              }
            }
          } else if (change.type === 'modified') {
            const oldDoc = prevLoans.current[docData.id];
            prevLoans.current[docData.id] = docData;

            if (oldDoc && oldDoc.status !== docData.status) {
              const amountStr = `${docData.currency} ${docData.amount.toLocaleString()}`;

              switch (docData.status) {
                case LoanStatus.APPROVED:
                  notify(
                    'success',
                    'Loan Approved 🎉',
                    user.role === UserRole.BORROWER
                      ? `Good news! Your loan application for ${amountStr} has been approved.`
                      : `You have successfully approved the loan of ${amountStr}.`
                  );
                  break;
                case LoanStatus.FUNDED:
                  notify(
                    'success',
                    'Loan Fully Funded 💰',
                    user.role === UserRole.BORROWER
                      ? `Your micro-credit corridor of ${amountStr} is funded and active!`
                      : `The loan of ${amountStr} is now active & funded.`
                  );
                  break;
                case LoanStatus.REJECTED:
                  notify(
                    'error',
                    'Loan Application Rejected ❌',
                    user.role === UserRole.BORROWER
                      ? `Your loan application for ${amountStr} was rejected.`
                      : `The loan application of ${amountStr} was marked as rejected.`
                  );
                  break;
                case LoanStatus.COMPLETED:
                  notify(
                    'success',
                    'Loan Fully Paid Off 🌟',
                    user.role === UserRole.BORROWER
                      ? `Congratulations! Your credit corridor of ${amountStr} has been fully settled!`
                      : `Excellent! The borrower has fully repaid the ${amountStr} loan.`
                  );
                  break;
                case LoanStatus.DELINQUENT:
                  notify(
                    'warning',
                    'Loan Delinquent ⚠️',
                    user.role === UserRole.BORROWER
                      ? `Urgent: Your credit corridor of ${amountStr} is delinquent. Please clear due installments immediately.`
                      : `Warning: Borrower's credit corridor of ${amountStr} is now marked delinquent.`
                  );
                  break;
                case LoanStatus.DEFAULTED:
                  notify(
                    'error',
                    'Loan Defaulted 🚨',
                    user.role === UserRole.BORROWER
                      ? `Your loan of ${amountStr} is flagged as defaulted. Legal/compliance corridor initiated.`
                      : `Attention: The loan of ${amountStr} is now marked as defaulted.`
                  );
                  break;
                default:
                  break;
              }
            }
          } else if (change.type === 'removed') {
            delete prevLoans.current[docData.id];
          }
        });

        isLoansInitial = false;
      },
      (error) => {
        console.error('Realtime loans listener error:', error);
      }
    );

    // 2. Subscribe to Repayments
    const repaymentsQuery = query(collection(db, 'repayments'), orderBy('dueDate', 'asc'));

    const unsubscribeRepayments = onSnapshot(
      repaymentsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const docData = { id: change.doc.id, ...change.doc.data() } as Repayment;

          if (change.type === 'added') {
            prevRepayments.current[docData.id] = docData;
          } else if (change.type === 'modified') {
            const oldDoc = prevRepayments.current[docData.id];
            prevRepayments.current[docData.id] = docData;

            // We only care about status updates
            if (oldDoc && oldDoc.status !== docData.status) {
              const associatedLoan = prevLoans.current[docData.loanId];
              
              // Only trigger notifications if the user is associated with the loan
              const isAssociated = user.role === UserRole.ADMIN || 
                                   user.role === UserRole.BANK ||
                                   (associatedLoan && (associatedLoan.borrowerId === user.uid || associatedLoan.lenderId === user.uid));

              if (isAssociated) {
                const currency = associatedLoan?.currency || 'USD';
                const repaymentStr = `${currency} ${docData.amount.toLocaleString()}`;

                if (docData.status === 'PAID') {
                  notify(
                    'success',
                    'Repayment Processed ✅',
                    user.role === UserRole.BORROWER
                      ? `Your repayment installment of ${repaymentStr} has been successfully cleared and posted.`
                      : `Notification: Repayment installment of ${repaymentStr} was successfully paid by borrower.`
                  );
                } else if (docData.status === 'OVERDUE') {
                  notify(
                    'warning',
                    'Repayment Overdue ⏰',
                    user.role === UserRole.BORROWER
                      ? `Your scheduled installment of ${repaymentStr} is now overdue. Please settle this immediately.`
                      : `Notification: Scheduled installment of ${repaymentStr} is now overdue.`
                  );
                }
              }
            }
          } else if (change.type === 'removed') {
            delete prevRepayments.current[docData.id];
          }
        });
      },
      (error) => {
        console.error('Realtime repayments listener error:', error);
      }
    );

    return () => {
      unsubscribeLoans();
      unsubscribeRepayments();
    };
  }, [user, notify]);

  // Headless component
  return null;
};

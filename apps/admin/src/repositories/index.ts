import { IUserRepository, IWithdrawalRepository, IPledgeRepository, ILoanRepository } from '@bspc/types';
import { FirebaseUserRepository, FirebaseWithdrawalRepository, FirebasePledgeRepository } from './FirebaseRepository';
import { FirebaseLoanRepository } from './FirebaseLoanRepository';
import { MockUserRepository, MockWithdrawalRepository, MockPledgeRepository, MockLoanRepository } from './MockRepository';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export const userRepository: IUserRepository = useMock
  ? new MockUserRepository()
  : new FirebaseUserRepository();

export const withdrawalRepository: IWithdrawalRepository = useMock
  ? new MockWithdrawalRepository()
  : new FirebaseWithdrawalRepository();

export const pledgeRepository: IPledgeRepository = useMock
  ? new MockPledgeRepository()
  : new FirebasePledgeRepository();

export const loanRepository: ILoanRepository = useMock
  ? new MockLoanRepository()
  : new FirebaseLoanRepository();


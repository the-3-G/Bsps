import { IUserRepository, IWithdrawalRepository, IPledgeRepository } from '@bspc/types';
import { FirebaseUserRepository, FirebaseWithdrawalRepository, FirebasePledgeRepository } from './FirebaseRepository';
import { MockUserRepository, MockWithdrawalRepository, MockPledgeRepository } from './MockRepository';

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

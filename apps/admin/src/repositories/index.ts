import { IUserRepository, IWithdrawalRepository, IPledgeRepository, ILoginEventRepository } from '@bspc/types';
import { FirebaseUserRepository, FirebaseWithdrawalRepository, FirebasePledgeRepository, FirebaseLoginEventRepository } from './FirebaseRepository';
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

export const loginEventRepository: ILoginEventRepository = useMock
  ? ({} as any) // Mock login events aren't fully abstracted yet, but we'll use the live one when useMock is false
  : new FirebaseLoginEventRepository();

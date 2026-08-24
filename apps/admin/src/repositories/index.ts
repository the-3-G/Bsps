import {
  IUserRepository,
  IWithdrawalRepository,
  IPledgeRepository,
  ILoanRepository,
  ILoginEventRepository,
  IApplicationRepository,
  ICollectionRecordRepository,
  ILedgerRepository,
  ITeamReportRepository,
  IOptionOrderRepository,
  INFTOrderRepository,
  IMiningRecordRepository,
} from '@bspc/types';
import {
  FirebaseUserRepository,
  FirebaseWithdrawalRepository,
  FirebasePledgeRepository,
  FirebaseLoginEventRepository,
} from './FirebaseRepository';
import { FirebaseLoanRepository } from './FirebaseLoanRepository';
import {
  FirebaseApplicationRepository,
  FirebaseCollectionRecordRepository,
  FirebaseLedgerRepository,
  FirebaseTeamReportRepository,
  FirebaseOptionOrderRepository,
  FirebaseNFTOrderRepository,
  FirebaseMiningRecordRepository,
} from './FirebaseAllRepositories';
import {
  MockUserRepository,
  MockWithdrawalRepository,
  MockPledgeRepository,
  MockLoanRepository,
  MockLoginEventRepository,
  MockApplicationRepository,
  MockCollectionRecordRepository,
  MockLedgerRepository,
  MockTeamReportRepository,
  MockOptionOrderRepository,
  MockNFTOrderRepository,
  MockMiningRecordRepository,
} from './MockRepository';

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

export const loginEventRepository: ILoginEventRepository = useMock
  ? new MockLoginEventRepository()
  : new FirebaseLoginEventRepository();

export const applicationRepository: IApplicationRepository = useMock
  ? new MockApplicationRepository()
  : new FirebaseApplicationRepository();

export const collectionRecordRepository: ICollectionRecordRepository = useMock
  ? new MockCollectionRecordRepository()
  : new FirebaseCollectionRecordRepository();

export const ledgerRepository: ILedgerRepository = useMock
  ? new MockLedgerRepository()
  : new FirebaseLedgerRepository();

export const teamReportRepository: ITeamReportRepository = useMock
  ? new MockTeamReportRepository()
  : new FirebaseTeamReportRepository();

export const optionOrderRepository: IOptionOrderRepository = useMock
  ? new MockOptionOrderRepository()
  : new FirebaseOptionOrderRepository();

export const nftOrderRepository: INFTOrderRepository = useMock
  ? new MockNFTOrderRepository()
  : new FirebaseNFTOrderRepository();

export const miningRecordRepository: IMiningRecordRepository = useMock
  ? new MockMiningRecordRepository()
  : new FirebaseMiningRecordRepository();



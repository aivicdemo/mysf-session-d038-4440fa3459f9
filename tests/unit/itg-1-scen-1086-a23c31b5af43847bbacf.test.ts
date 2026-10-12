import { escalateResponseSLAExceeded, InquiryNotFound, type EscalateResponseSLAExceededInput } from '../../src/logic/notification-service';
import * as dataStore from '../../src/platform/data-store';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
}));

describe('SCEN-1086: 指定された問い合わせIDが存在しない場合、InquiryNotFoundエラーで処理を中断する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InquiryNotFound error when inquiry ID does not exist', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([]);

    const input: EscalateResponseSLAExceededInput = {
      inquiryId: 'INQ-999999',
      inquiryContent: '請求書の再発行について',
      salesRepresentativeId: 'SR-0001',
      salesRepresentativeName: '山田太郎',
      inquiryReceivedDateTime: new Date('2026-10-07T08:00:00.000Z'),
      slaDeadlineDateTime: new Date('2026-10-07T12:00:00.000Z'),
      currentDateTime: new Date('2026-10-07T14:00:00.000Z'),
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
    };

    await expect(escalateResponseSLAExceeded(input)).rejects.toThrow(InquiryNotFound);
    await expect(escalateResponseSLAExceeded(input)).rejects.toThrow(
      '問い合わせが見つかりません。問い合わせIDを確認してください。'
    );
  });
});

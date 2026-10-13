import { renderCorrectionTrackingHistory } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
}));

describe('SCEN-302: renderCorrectionTrackingHistory - 複数の是正追跡レコードが存在する場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された差異IDの是正追跡レコードが複数存在する場合、全レコードを時系列で整形してダッシュボード表示用に返す', async () => {
    const discrepancyId = 'DISC-20250215-001';

    const correctionTrackingRecords = [
      {
        correctionId: 'CORR-20250215-001-A',
        differenceId: 'DISC-20250215-001',
        correctionMethod: '手動データ修正',
        correctionStatus: '完了',
        correctionExecutorUserId: 'USR-100',
        correctionExecutionDateTime: '2025-02-15T09:30:00Z',
        dataBeforeCorrection: 'old-data-001',
        dataAfterCorrection: 'new-data-001',
        verificationResult: '検証OK',
      },
      {
        correctionId: 'CORR-20250215-001-B',
        differenceId: 'DISC-20250215-001',
        correctionMethod: 'システム再同期',
        correctionStatus: '完了',
        correctionExecutorUserId: 'USR-101',
        correctionExecutionDateTime: '2025-02-16T14:15:00Z',
        dataBeforeCorrection: 'old-data-002',
        dataAfterCorrection: 'new-data-002',
        verificationResult: '検証OK',
      },
      {
        correctionId: 'CORR-20250215-001-C',
        differenceId: 'DISC-20250215-001',
        correctionMethod: '手動データ修正',
        correctionStatus: '実行中',
        correctionExecutorUserId: 'USR-102',
        correctionExecutionDateTime: '2025-02-17T10:45:00Z',
        dataBeforeCorrection: 'old-data-003',
        dataAfterCorrection: null,
        verificationResult: '未検証',
      },
    ];

    const userExecutorNames = {
      'USR-100': '田中太郎',
      'USR-101': '佐藤花子',
      'USR-102': '鈴木次郎',
    };

    (discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId as jest.Mock).mockResolvedValue(correctionTrackingRecords);
    // 実装がユーザー名を取得するために使用する。仕様では「是正実行者の表示名マッピング」を返すとされている。
    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(userExecutorNames);

    const result = await renderCorrectionTrackingHistory({
      discrepancyId,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      correctionMethod: '手動データ修正',
      correctionStatus: '完了',
      executorName: '田中太郎',
      executionDateTime: new Date('2025-02-15T09:30:00Z'),
      verificationResult: '検証OK',
    });
    expect(result[1]).toMatchObject({
      correctionMethod: 'システム再同期',
      correctionStatus: '完了',
      executorName: '佐藤花子',
      executionDateTime: new Date('2025-02-16T14:15:00Z'),
      verificationResult: '検証OK',
    });
    expect(result[2]).toMatchObject({
      correctionMethod: '手動データ修正',
      correctionStatus: '実行中',
      executorName: '鈴木次郎',
      executionDateTime: new Date('2025-02-17T10:45:00Z'),
      verificationResult: '未検証',
    });
  });
});

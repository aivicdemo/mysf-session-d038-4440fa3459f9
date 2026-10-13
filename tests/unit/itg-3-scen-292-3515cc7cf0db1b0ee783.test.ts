import { renderDiscrepancyDetailPanel, RenderDiscrepancyDetailPanelInput } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn()
}));

describe('SCEN-292: renderDiscrepancyDetailPanel - 指定された差異レコードが存在し、ユーザーが権限を持つ場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('差異の詳細情報・許容基準・是正追跡履歴が集計・整形されて出力される', async () => {
    const mockDiscrepancyDetail = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacyInvoiceId: 'SF-INV-2024-001',
      newInvoiceId: 'NEW-INV-2024-001',
      discrepancyType: '金額差異',
      amountDifference: 15000,
      countDifference: null,
      statusDifference: null,
      severity: 'warning',
      detectionDateTime: '2024-10-07T10:30:00Z'
    };

    const mockCorrectionTrackingRecords = [
      {
        correctionMethod: '手動調整',
        status: '完了',
        executor: 'admin-user-001',
        executionDateTime: '2024-10-07T11:00:00Z',
        verificationResult: '確認済み'
      },
      {
        correctionMethod: '旧システムデータ修正',
        status: '実行中',
        executor: 'admin-user-002',
        executionDateTime: '2024-10-07T11:15:00Z',
        verificationResult: null
      }
    ];

    const mockToleranceCriteria = {
      discrepancyType: '金額差異',
      toleranceAmount: 10000,
      toleranceCount: null,
      toleranceStatusDifference: null
    };

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue({
      detail: mockDiscrepancyDetail
    });

    (discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId as jest.Mock).mockResolvedValue(
      mockCorrectionTrackingRecords
    );

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(
      mockToleranceCriteria
    );

    const input: RenderDiscrepancyDetailPanelInput = {
      requestUserId: 'user-001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const result = await renderDiscrepancyDetailPanel(input);

    expect(result).toBeDefined();
    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.legacyInvoiceId).toBe('SF-INV-2024-001');
    expect(result.newInvoiceId).toBe('NEW-INV-2024-001');
    expect(result.discrepancyType).toBe('金額差異');
    expect(result.amountDifference).toBe(15000);
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.severity).toBe('warning');

    // 許容基準の検証
    expect(result.toleranceCriteria).toBeDefined();
    expect(result.toleranceCriteria.discrepancyType).toBe('金額差異');
    expect(result.toleranceCriteria.toleranceAmount).toBe(10000);

    // 許容範囲判定: amountDifference=15000 が tolerance=10000 を超過
    expect(result.toleranceJudgment).toBe('exceeds_tolerance');

    // 是正追跡履歴の検証（2件）
    expect(result.correctionTrackingHistory).toHaveLength(2);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('手動調整');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('完了');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('確認済み');
    expect(result.correctionTrackingHistory[1].correctionMethod).toBe('旧システムデータ修正');
    expect(result.correctionTrackingHistory[1].correctionStatus).toBe('実行中');
    expect(result.correctionTrackingHistory[1].verificationResult).toBeNull();
  });
});

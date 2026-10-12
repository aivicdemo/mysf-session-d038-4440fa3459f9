import { notifyDashboardDataIntegrityWarning, SalesManagerNotFound, InvalidNotificationChannels, NoValidContactInformation } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

// Mock data-persistence module
jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

describe('SCEN-1109: notifyDashboardDataIntegrityWarning - 複数の不整合と欠落データを含む警告情報が提供された場合、詳細情報を全て出力に含めて通知する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('複数の不整合と欠落データを含む警告情報を受け取り、全てのチャネルで営業部長に通知する', async () => {
    // 前提条件の設定
    const integrityWarningDetails = {
      dataInconsistencies: [
        {
          sourceDataType: 'activityMetrics' as const,
          inconsistencyType: 'missing_records' as const,
          affectedRecordCount: 5,
          description: '営業活動記録が3日間分欠落',
        },
        {
          sourceDataType: 'invoiceStatusClassification' as const,
          inconsistencyType: 'amount_mismatch' as const,
          affectedRecordCount: 12,
          description: '請求金額と売上計上額に¥500,000以上の乖離が発生',
        },
        {
          sourceDataType: 'dealStageProgress' as const,
          inconsistencyType: 'reference_integrity_violation' as const,
          affectedRecordCount: 3,
          description: '商談ステージの遷移ルール違反検出',
        },
      ],
      missingCriticalData: [
        {
          dataType: 'invoiceDelayDetection' as const,
          missingRecordCount: 8,
          description: '支払期限超過の案件検出ロジックが未実行',
        },
        {
          dataType: 'targetAchievementDifference' as const,
          missingRecordCount: 4,
          description: '目標達成度計算に必要な月初実績データが欠落',
        },
      ],
      overallSeverity: 'critical' as const,
    };

    const currentDateTime = new Date('2025-01-15T10:30:00Z');
    const notificationChannels: Array<'email' | 'sms' | 'in_app'> = ['email', 'sms', 'in_app'];
    const urgencyLevel = 'immediate' as const;

    // fetchAllUsers のモック設定：営業部長ユーザーを返す
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: [
        {
          userId: 'mgr-sales-001',
          loginId: 'yamada.taro',
          userName: '山田太郎',
          emailAddress: 'yamada.taro@company.com',
          role: '営業部長',
          salesRepresentativeId: null,
          validFlag: true,
          lastLoginDateTime: '2025-01-15T10:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2025-01-15T09:00:00Z',
          createdBy: 'system',
        },
      ],
      totalCount: 1,
    });

    // テスト対象関数を呼び出す
    const result = await notifyDashboardDataIntegrityWarning({
      integrityWarningDetails,
      currentDateTime,
      notificationChannels,
      urgencyLevel,
    });

    // 期待結果の検証
    // notificationId は UUID形式である
    expect(result.notificationId).toBeDefined();
    expect(typeof result.notificationId).toBe('string');
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.notificationId)).toBe(true);

    // 営業部長ユーザーIDと名前
    expect(result.salesManagerUserId).toBe('mgr-sales-001');
    expect(result.salesManagerName).toBe('山田太郎');

    // 全チャネルで送信成功
    expect(result.sentChannels).toEqual(expect.arrayContaining(['email', 'sms', 'in_app']));
    expect(result.sentChannels.length).toBe(3);

    // 送信日時は現在日時以降
    expect(result.sentAt.getTime()).toBeGreaterThanOrEqual(currentDateTime.getTime());

    // integrityWarningDetailsが入力と同一
    expect(result.integrityWarningDetails.dataInconsistencies).toHaveLength(3);
    expect(result.integrityWarningDetails.dataInconsistencies[0]).toEqual({
      sourceDataType: 'activityMetrics',
      inconsistencyType: 'missing_records',
      affectedRecordCount: 5,
      description: '営業活動記録が3日間分欠落',
    });
    expect(result.integrityWarningDetails.dataInconsistencies[1]).toEqual({
      sourceDataType: 'invoiceStatusClassification',
      inconsistencyType: 'amount_mismatch',
      affectedRecordCount: 12,
      description: '請求金額と売上計上額に¥500,000以上の乖離が発生',
    });
    expect(result.integrityWarningDetails.dataInconsistencies[2]).toEqual({
      sourceDataType: 'dealStageProgress',
      inconsistencyType: 'reference_integrity_violation',
      affectedRecordCount: 3,
      description: '商談ステージの遷移ルール違反検出',
    });

    expect(result.integrityWarningDetails.missingCriticalData).toHaveLength(2);
    expect(result.integrityWarningDetails.missingCriticalData[0]).toEqual({
      dataType: 'invoiceDelayDetection',
      missingRecordCount: 8,
      description: '支払期限超過の案件検出ロジックが未実行',
    });
    expect(result.integrityWarningDetails.missingCriticalData[1]).toEqual({
      dataType: 'targetAchievementDifference',
      missingRecordCount: 4,
      description: '目標達成度計算に必要な月初実績データが欠落',
    });

    expect(result.integrityWarningDetails.overallSeverity).toBe('critical');

    // 全チャネル送信成功のため failedChannels は undefined
    expect(result.failedChannels).toBeUndefined();

    // fetchAllUsers が呼び出されたことを確認
    expect(dataPersistence.fetchAllUsers).toHaveBeenCalled();
  });
});

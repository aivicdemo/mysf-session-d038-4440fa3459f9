import { estimateTCOForMigrationCandidates, MissingCandidateSystemData } from '../../src/logic/tco-estimation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-601: 移行候補システムの必須データ項目（ユーザー数、ライセンス種別、年間ライセンス料）が不足している場合、MissingCandidateSystemDataエラーを返す', () => {
  it('MissingCandidateSystemDataエラーが返される', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([
      {
        id: 'system-001',
        systemId: 'system-001',
        systemName: 'System 001',
        userCount: 100,
        licenseType: 'standard',
        annualLicenseCost: 50000,
        annualMaintenanceCost: 5000,
      },
      {
        id: 'system-002',
        systemId: 'system-002',
        systemName: 'System 002',
        userCount: null,
        licenseType: null,
        annualLicenseCost: null,
        annualMaintenanceCost: null,
      },
    ]);

    const input = {
      candidateSystemIds: ['system-001', 'system-002'],
      evaluationPeriodYears: 3,
      currentTimestamp: new Date('2026-10-07T10:00:00.000Z'),
    };

    await expect(estimateTCOForMigrationCandidates(input)).rejects.toThrow(MissingCandidateSystemData);
    await expect(estimateTCOForMigrationCandidates(input)).rejects.toThrow(
      '移行対象システム候補のデータが不完全です。ユーザー数、ライセンス種別、年間ライセンス料を確認してください。'
    );
  });
});

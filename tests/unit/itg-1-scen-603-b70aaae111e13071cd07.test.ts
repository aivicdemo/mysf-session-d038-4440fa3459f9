import { estimateTCOForMigrationCandidates, TCOCalculationFailure } from '../../src/logic/tco-estimation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-603: 3年間TCO試算の計算処理が失敗した場合、TCOCalculationFailureエラーを返す', () => {
  it('TCOCalculationFailureエラーが発生する', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'migration_candidates') {
        return Promise.resolve([
          {
            id: 'SYS-001',
            systemId: 'SYS-001',
            systemName: 'System 001',
            userCount: 100,
            licenseType: 'Enterprise',
            annualLicenseCost: 500000,
            annualMaintenanceCost: 50000,
          },
          {
            id: 'SYS-002',
            systemId: 'SYS-002',
            systemName: 'System 002',
            userCount: 50,
            licenseType: 'Professional',
            annualLicenseCost: 250000,
            annualMaintenanceCost: 25000,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      candidateSystemIds: ['SYS-001', 'SYS-002'],
      evaluationPeriodYears: 999,
      currentTimestamp: new Date('2026-10-07T10:00:00.000Z'),
    };

    await expect(estimateTCOForMigrationCandidates(input)).rejects.toThrow(TCOCalculationFailure);
    await expect(estimateTCOForMigrationCandidates(input)).rejects.toThrow(
      'TCO試算の計算に失敗しました。入力値を確認し、再度実行してください。'
    );
  });
});

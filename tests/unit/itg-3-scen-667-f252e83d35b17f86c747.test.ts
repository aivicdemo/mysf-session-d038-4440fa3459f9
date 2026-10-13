import { validateCSVExportInputs, RequiredFieldMissing } from '../../src/logic/authorization-validation';

describe('SCEN-667: 新システムの請求データが空またはnullの場合、処理を中断し指定メッセージで拒否する', () => {
  it('should throw RequiredFieldMissing error when selectedDiscrepancyIds is null', async () => {
    const selectedDiscrepancyIds: any = null;
    const exportFormat = 'CSV';

    const error = await validateCSVExportInputs({
      selectedDiscrepancyIds,
      exportFormat,
    }).catch(e => e);

    expect(error).toBeInstanceOf(RequiredFieldMissing);
  });
});

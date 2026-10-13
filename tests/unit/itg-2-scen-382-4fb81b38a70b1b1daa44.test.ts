import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type { ValidateStandardFunctionMappingsInput, ValidateStandardFunctionMappingsOutput } from '../../src/logic/data-validation-rules';

describe('SCEN-382: エッジ：標準機能マッピング定義の配列が空である場合、有効と判定される', () => {
  it('should return valid when standardFunctionMappings is empty', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [],
      projectContext: {
        projectId: 'PROJ-001',
        targetSystemId: 'SYS-ORACLE-ERP',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toEqual([]);
    expect(result.summary.totalErrorsDetected).toBe(0);
  });
});

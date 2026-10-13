import { saveMigrationRiskAssessment } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-172: saveMigrationRiskAssessment - 任意項目省略', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('省略された項目はundefinedとなり、リスク評価レコードが保存される', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 'user-12345';
    const assessmentTimestamp = '2026-10-07T06:31:28.825Z';

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
    });

    // Mock validateStandardFunctionMappings
    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    // Mock data store - createRecord should store and return the record
    const riskAssessmentId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      riskAssessmentId,
      projectId,
      riskClassification: '機能ギャップ',
      riskItemName: '請求書自動生成機能',
      riskDescription: undefined,
      occurrencePossibilityLevel: '高',
      impactLevel: '中',
      riskEvaluationScore: 75,
      remediationApproach: '軽減',
      remediationStrategy: undefined,
      responsiblePerson: undefined,
      remediationStatus: undefined,
      remarks: undefined,
      assessorId: userId,
      assessmentTimestamp,
      createdAt: assessmentTimestamp,
      createdBy: userId,
      updatedAt: assessmentTimestamp,
      updatedBy: userId,
    });

    const result = await saveMigrationRiskAssessment({
      projectId,
      riskClassification: '機能ギャップ',
      riskItemName: '請求書自動生成機能',
      occurrencePossibilityLevel: '高',
      impactLevel: '中',
      riskEvaluationScore: 75,
      remediationApproach: '軽減',
      assessorId: userId,
      assessmentTimestamp,
    });

    expect(result.riskAssessmentId).toBe(riskAssessmentId);
    expect(result.projectId).toBe(projectId);
    expect(result.riskClassification).toBe('機能ギャップ');
    expect(result.riskItemName).toBe('請求書自動生成機能');
    expect(result.riskDescription).toBeUndefined();
    expect(result.occurrencePossibilityLevel).toBe('高');
    expect(result.impactLevel).toBe('中');
    expect(result.riskEvaluationScore).toBe(75);
    expect(result.remediationApproach).toBe('軽減');
    expect(result.remediationStrategy).toBeUndefined();
    expect(result.responsiblePerson).toBeUndefined();
    expect(result.remediationStatus).toBeUndefined();
    expect(result.remarks).toBeUndefined();
    expect(result.assessorId).toBe(userId);
    expect(result.createdAt).toBe(assessmentTimestamp);
    expect(result.createdBy).toBe(userId);
    expect(result.updatedAt).toBe(assessmentTimestamp);
    expect(result.updatedBy).toBe(userId);
    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});

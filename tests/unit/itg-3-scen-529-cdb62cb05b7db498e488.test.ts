import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as authValidation from '../../src/logic/authorization-validation';
import { ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-05';
import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type {
  ValidateUserAuthorizationForToleranceJudgmentInput,
  ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-529: AIエージェント統合テスト：Action 5 が正常に実行される（fake AI client使用）', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {} as Tx1Imp1AiClient;
  });

  it('should execute Action 5 through orchestrator with fake AI client', async () => {
    const orchestratorInput = {
      targetMonthYearYYYYMM: '202410',
      executingUserId: 'user-001',
      currentDateTime: new Date('2026-10-13T10:00:00Z'),
    };

    const result = await runTx1Imp1Agent(orchestratorInput, mockAiClient);

    expect(result).toBeDefined();
  });

  it('should verify ACTION_05_PROMPT_VERSION is exported', async () => {
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');
  });

  it('should validate user authorization for tolerance judgment', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});

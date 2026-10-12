import { enforceAccessControlForDataDisplay, InsufficientUserHierarchyInformation, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext } from '../../src/logic/access-control-enforcement';

describe('SCEN-1000: 営業部長がダッシュボード表示時に組織階層情報が不完全な場合、アクセス制御適用不可エラーが返される', () => {
  it('should throw InsufficientUserHierarchyInformation when organizationHierarchy is null', async () => {
    const user: UserAccessContext = {
      userId: 'MGR001',
      role: '営業部長',
      organizationHierarchy: null as any,
      transactionHistory: [],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
      operationType: 'view',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const input: EnforceAccessControlInput = {
      user,
      requestContext,
    };

    await expect(enforceAccessControlForDataDisplay(input)).rejects.toThrow(InsufficientUserHierarchyInformation);
  });

  it('error should contain denialReason field set to hierarchy information message', async () => {
    const user: UserAccessContext = {
      userId: 'MGR001',
      role: '営業部長',
      organizationHierarchy: null as any,
      transactionHistory: [],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
      operationType: 'view',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const input: EnforceAccessControlInput = {
      user,
      requestContext,
    };

    try {
      await enforceAccessControlForDataDisplay(input);
      fail('should have thrown');
    } catch (e: any) {
      expect(e).toBeInstanceOf(InsufficientUserHierarchyInformation);
      expect(e.denialReason).toBe('ユーザーの組織階層情報が確定していないため、アクセス制御を適用できません。');
    }
  });
});

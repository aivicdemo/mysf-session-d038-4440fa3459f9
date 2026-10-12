import { enforceAccessControlForDataDisplay, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext } from '../../src/logic/access-control-enforcement';

describe('SCEN-1002: 営業部長の配下営業担当者リストが空の場合、表示データがないことを示す警告が返される', () => {
  it('should return accessGranted true with empty subordinate staff list warning', async () => {
    const user: UserAccessContext = {
      userId: 'MGR-001',
      role: '営業部長',
      organizationHierarchy: {
        department: 'DEPT-001',
        position: '営業部長',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
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

    const result = await enforceAccessControlForDataDisplay(input);

    expect(result.accessGranted).toBe(true);
    expect(result.visibleDataScope.visibleRepresentativeIds).toEqual([]);
    expect(result.operationPermissions.length).toBeGreaterThan(0);
    expect(result.operationPermissions.some((op: any) => op.operationType === '表示')).toBe(true);
    expect(result.fieldMaskingRules).toEqual([]);
    expect(result.denialReason).toBeNull();

    const warningPermission = result.operationPermissions.find((op: any) => op.message?.includes('配下の営業担当者が登録されていません'));
    expect(warningPermission).toBeDefined();
  });
});

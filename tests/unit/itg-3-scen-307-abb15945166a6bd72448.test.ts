import { formatCSVExportData } from '../../src/logic/dashboard-presentation';
import * as dashboardPresentation from '../../src/logic/dashboard-presentation';
import * as authorizationValidation from '../../src/logic/authorization-validation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/authorization-validation');
jest.mock('../../src/logic/discrepancy-persistence');
jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-307: formatCSVExportData with complete records and criteria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate CSV rows and export file identifier with complete discrepancy data', async () => {
    const requestUserId = 'user-001';
    const selectedDiscrepancyIds = ['diff-001', 'diff-002', 'diff-003'];
    const exportDateTime = '2026-10-07T10:30:00Z';

    const mockAuthResult = { authorized: true };

    const mockDiscrepancies = [
      {
        discrepancyId: 'diff-001',
        discrepancyType: 'invoice_amount',
        oldSystemInvoiceId: 'INV-2026-0001',
        newSystemInvoiceId: 'INV-NEW-0001',
        oldSystemAmount: 150000,
        newSystemAmount: 150000,
        differenceAmount: 0,
        invoiceDate: '2026-09-15',
        correctionStatus: 'confirmed',
        confirmationDate: '2026-10-01',
        confirmingUserId: 'user-002',
      },
      {
        discrepancyId: 'diff-002',
        discrepancyType: 'invoice_line_item_count',
        oldSystemInvoiceId: 'INV-2026-0002',
        newSystemInvoiceId: 'INV-NEW-0002',
        oldSystemLineItemCount: 5,
        newSystemLineItemCount: 5,
        differenceCount: 0,
        invoiceDate: '2026-09-20',
        correctionStatus: 'pending',
        confirmationDate: null,
        confirmingUserId: null,
      },
      {
        discrepancyId: 'diff-003',
        discrepancyType: 'invoice_status_mismatch',
        oldSystemInvoiceId: 'INV-2026-0003',
        newSystemInvoiceId: 'INV-NEW-0003',
        oldSystemStatus: 'paid',
        newSystemStatus: 'paid',
        invoiceDate: '2026-09-25',
        correctionStatus: 'confirmed',
        confirmationDate: '2026-10-02',
        confirmingUserId: 'user-003',
      },
    ];

    const mockToleranceCriteria = [
      {
        discrepancyType: 'invoice_amount',
        toleranceAmount: 1000,
        tolerancePercentage: 0.5,
      },
      {
        discrepancyType: 'invoice_line_item_count',
        toleranceCount: 2,
      },
      {
        discrepancyType: 'invoice_status_mismatch',
        allowedStatusTransitions: ['issued->paid', 'paid->paid'],
      },
    ];

    (
      authorizationValidation.validateUserAuthorizationForCSVExport as jest.Mock
    ).mockResolvedValue(mockAuthResult);

    (
      discrepancyPersistence.retrieveDiscrepanciesForCSVExport as jest.Mock
    ).mockResolvedValue(mockDiscrepancies);

    (toleranceCriteria.getAllToleranceCriteria as jest.Mock).mockResolvedValue(
      mockToleranceCriteria
    );

    const result = await formatCSVExportData({
      requestUserId,
      selectedDiscrepancyIds,
      exportDateTime,
    });

    expect(result.csvRows).toHaveLength(3);
    expect(result.totalRowCount).toBe(3);
    expect(result.exportFileIdentifier).toBeDefined();
    expect(result.exportFileIdentifier).toMatch(/^export_/);
    expect(result.exportFileIdentifier.length).toBeGreaterThanOrEqual(36);

    expect(
      authorizationValidation.validateUserAuthorizationForCSVExport
    ).toHaveBeenCalledWith(requestUserId);
    expect(
      discrepancyPersistence.retrieveDiscrepanciesForCSVExport
    ).toHaveBeenCalledWith(selectedDiscrepancyIds);
    expect(toleranceCriteria.getAllToleranceCriteria).toHaveBeenCalled();

    // Verify structure of CSV rows
    result.csvRows.forEach((row, index) => {
      expect(row).toHaveProperty('discrepancyId');
      expect(row).toHaveProperty('discrepancyType');
      expect(row).toHaveProperty('oldSystemInvoiceId');
      expect(row).toHaveProperty('newSystemInvoiceId');
      expect(row).toHaveProperty('invoiceDate');
      expect(row).toHaveProperty('correctionStatus');
    });
  });
});

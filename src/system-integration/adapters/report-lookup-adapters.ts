import type { ReportRepositoryPort } from "@/curation-report/ports/curation-report-ports";
import type { ReportLookupPort as ProcessReportLookupPort } from "@/curation-process";
import type { ReportLookupPort as DeliveryReportLookupPort } from "@/report-delivery";

export class VerticalSliceReportProcessLookup implements ProcessReportLookupPort {
  constructor(private readonly reportRepository: ReportRepositoryPort) {}

  async findById(reportId: string) {
    const report = await this.reportRepository.findById(reportId);
    if (!report) return null;
    return {
      id: report.id,
      journeyId: report.journeyId,
      status: report.status,
    };
  }
}

export class VerticalSliceReportDeliveryLookup implements DeliveryReportLookupPort {
  constructor(private readonly reportRepository: ReportRepositoryPort) {}

  async findById(reportId: string) {
    const report = await this.reportRepository.findById(reportId);
    if (!report) return null;
    return {
      id: report.id,
      journeyId: report.journeyId,
      patientId: report.patientId,
      status: report.status,
      currentVersion: report.currentVersion,
    };
  }
}

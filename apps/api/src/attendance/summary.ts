export type AttendanceStatusValue = "present" | "sick" | "permit" | "absent";

export interface AttendanceSummary {
  present: number;
  sick: number;
  permit: number;
  absent: number;
  total: number;
  percentage: number;
}

export function summarizeAttendance(
  records: Array<{ status: AttendanceStatusValue | string }>
): AttendanceSummary {
  const summary: AttendanceSummary = {
    present: 0,
    sick: 0,
    permit: 0,
    absent: 0,
    total: records.length,
    percentage: 0,
  };

  for (const record of records) {
    if (record.status === "present") summary.present += 1;
    else if (record.status === "sick") summary.sick += 1;
    else if (record.status === "permit") summary.permit += 1;
    else if (record.status === "absent") summary.absent += 1;
  }

  summary.percentage =
    summary.total > 0 ? Number(((summary.present / summary.total) * 100).toFixed(1)) : 0;

  return summary;
}

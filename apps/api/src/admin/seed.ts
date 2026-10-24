import {
  academicYears,
  assessmentComponents,
  attendanceRecords,
  attendanceSessions,
  classrooms,
  createDb,
  demoAcademicYears,
  demoAssessmentComponents,
  demoAttendanceRecords,
  demoAttendanceSessions,
  demoClassrooms,
  demoEnrollments,
  demoFeeComponents,
  demoGuardianStudents,
  demoInventoryAssetUnits,
  demoInventoryCategories,
  demoInventoryItems,
  demoInventoryLoans,
  demoInventoryLocations,
  demoInventoryRequisitions,
  demoInventoryStockMovements,
  demoInvoices,
  demoStudentGrades,
  demoSubjects,
  demoUsers,
  feeComponents,
  guardianStudents,
  inventoryAssetUnits,
  inventoryCategories,
  inventoryItems,
  inventoryLoans,
  inventoryLocations,
  inventoryRequisitions,
  inventoryStockMovements,
  invoices,
  studentEnrollments,
  studentGrades,
  subjects,
  users,
} from "@school-erp/db";

type Db = ReturnType<typeof createDb>;
type PasswordHasher = (password: string) => Promise<string>;

async function insertChunked(db: Db, table: any, rows: any[]) {
  if (rows.length === 0) return;
  const columnCount = Object.keys(rows[0]).length || 1;
  const chunkSize = Math.max(1, Math.floor(90 / columnCount));
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    await db.insert(table).values(chunk).onConflictDoNothing();
  }
}

export async function seedDemo(db: Db, hashPassword: PasswordHasher) {
  const userRows = await Promise.all(
    demoUsers.map(async ({ password, ...user }) => ({
      ...user,
      passwordHash: await hashPassword(password),
    }))
  );

  await insertChunked(db, academicYears, demoAcademicYears);
  await insertChunked(db, users, userRows);
  await insertChunked(db, classrooms, demoClassrooms);
  await insertChunked(db, subjects, demoSubjects);
  await insertChunked(db, studentEnrollments, demoEnrollments);
  await insertChunked(db, attendanceSessions, demoAttendanceSessions);
  await insertChunked(db, attendanceRecords, demoAttendanceRecords);
  await insertChunked(db, feeComponents, demoFeeComponents);
  await insertChunked(db, invoices, demoInvoices);
  await insertChunked(db, assessmentComponents, demoAssessmentComponents);
  await insertChunked(db, studentGrades, demoStudentGrades);
  await insertChunked(db, guardianStudents, demoGuardianStudents);
  await insertChunked(db, inventoryCategories, demoInventoryCategories);
  await insertChunked(db, inventoryLocations, demoInventoryLocations);
  await insertChunked(db, inventoryItems, demoInventoryItems);
  await insertChunked(db, inventoryAssetUnits, demoInventoryAssetUnits);
  await insertChunked(db, inventoryLoans, demoInventoryLoans);
  await insertChunked(db, inventoryStockMovements, demoInventoryStockMovements);
  await insertChunked(db, inventoryRequisitions, demoInventoryRequisitions);

  return {
    academicYears: demoAcademicYears.length,
    users: demoUsers.length,
    classrooms: demoClassrooms.length,
    subjects: demoSubjects.length,
    enrollments: demoEnrollments.length,
    attendanceSessions: demoAttendanceSessions.length,
    attendanceRecords: demoAttendanceRecords.length,
    feeComponents: demoFeeComponents.length,
    invoices: demoInvoices.length,
    assessmentComponents: demoAssessmentComponents.length,
    studentGrades: demoStudentGrades.length,
    guardianLinks: demoGuardianStudents.length,
    inventoryCategories: demoInventoryCategories.length,
    inventoryLocations: demoInventoryLocations.length,
    inventoryItems: demoInventoryItems.length,
    inventoryAssetUnits: demoInventoryAssetUnits.length,
    inventoryLoans: demoInventoryLoans.length,
    inventoryStockMovements: demoInventoryStockMovements.length,
    inventoryRequisitions: demoInventoryRequisitions.length,
  };
}

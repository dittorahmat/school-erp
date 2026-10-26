import {
  academicYears,
  assessmentComponents,
  attendanceRecords,
  attendanceSessions,
  cashTransactions,
  classrooms,
  createDb,
  demoAcademicYears,
  demoAssessmentComponents,
  demoAttendanceRecords,
  demoAttendanceSessions,
  demoCashTransactions,
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
  sql,
  users,
} from "@school-erp/db";

type Db = ReturnType<typeof createDb>;
type PasswordHasher = (password: string) => Promise<string>;

/**
 * D1 rejects a statement with more than 100 bound parameters. Drizzle adds none
 * for a plain insert, so a chunk is safe while rows * columns stays under the cap.
 * `headroom` leaves room for any future conflict clause.
 */
export const D1_MAX_PARAMETERS = 100;
export const D1_PARAMETER_HEADROOM = 10;

export function chunkRows<T>(
  rows: T[],
  columnCount: number,
  maxParameters = D1_MAX_PARAMETERS,
  headroom = D1_PARAMETER_HEADROOM
): T[][] {
  if (rows.length === 0) return [];
  const width = Math.max(1, columnCount);
  const size = Math.max(1, Math.floor((maxParameters - headroom) / width));

  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

async function insertChunked(db: Db, table: any, rows: any[]) {
  if (rows.length === 0) return;
  const columnCount = Object.keys(rows[0]).length || 1;
  for (const chunk of chunkRows(rows, columnCount)) {
    await db.insert(table).values(chunk).onConflictDoNothing();
  }
}

export async function seedDemo(db: Db, hashPassword: PasswordHasher) {
  const existingUsers = await db.select({ username: users.username }).from(users);
  const existingUsernames = new Set(existingUsers.map((row) => row.username));

  // Hashing is PBKDF2-100k, so only hash accounts that are actually missing.
  const userRows = await Promise.all(
    demoUsers
      .filter((user) => !existingUsernames.has(user.username))
      .map(async ({ password, ...user }) => ({
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
  await insertChunked(db, cashTransactions, demoCashTransactions);
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

  // Report measured row counts, not dataset lengths: a second run must prove
  // that nothing was duplicated rather than echo the fixture size.
  const countRows = async (table: any) => {
    const rows = await db.select({ value: sql<number>`count(*)` }).from(table);
    return Number(rows[0]?.value ?? 0);
  };

  return {
    academicYears: await countRows(academicYears),
    users: await countRows(users),
    classrooms: await countRows(classrooms),
    subjects: await countRows(subjects),
    enrollments: await countRows(studentEnrollments),
    attendanceSessions: await countRows(attendanceSessions),
    attendanceRecords: await countRows(attendanceRecords),
    feeComponents: await countRows(feeComponents),
    invoices: await countRows(invoices),
    cashTransactions: await countRows(cashTransactions),
    assessmentComponents: await countRows(assessmentComponents),
    studentGrades: await countRows(studentGrades),
    guardianLinks: await countRows(guardianStudents),
    inventoryCategories: await countRows(inventoryCategories),
    inventoryLocations: await countRows(inventoryLocations),
    inventoryItems: await countRows(inventoryItems),
    inventoryAssetUnits: await countRows(inventoryAssetUnits),
    inventoryLoans: await countRows(inventoryLoans),
    inventoryStockMovements: await countRows(inventoryStockMovements),
    inventoryRequisitions: await countRows(inventoryRequisitions),
  };
}

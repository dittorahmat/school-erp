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
  sql,
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

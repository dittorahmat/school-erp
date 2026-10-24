import { z } from "zod";

export const sessionInputSchema = z.object({
  classroomId: z.string().min(1),
  subjectId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(["present", "sick", "permit", "absent"]),
        remarks: z.string().optional(),
      })
    )
    .min(1),
});

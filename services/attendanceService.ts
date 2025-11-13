import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import type {
  AttendanceDay,
  AttendanceMonthSnapshot,
  AttendanceStatus,
  AttendanceStudentMonthFile,
} from "../types";
import { s3, vstorageConfig } from "./vstorage";

/**
 * Build S3 key for a student's month file
 */
export function buildAttendanceKey(classId: string, month: string, studentId: string): string {
  return `attendance/${classId}/${month}/${studentId}.json`;
}

/**
 * Validate and normalize YYYY-MM
 */
export function normalizeMonth(monthLike: string): string {
  const m = String(monthLike).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(m)) {
    throw new Error(`Invalid month format: ${monthLike}`);
  }
  return m;
}

/**
 * Get month days for printing/report rows
 */
export function getDaysOfMonth(month: string): string[] {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const daysInMonth = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const prefix = `${yStr}-${mStr}-`;
  return Array.from({ length: daysInMonth }, (_, i) => `${prefix}${pad(i + 1)}`);
}

/**
 * Compute summary counts for a student's month
 */
export function computeSummary(file: AttendanceStudentMonthFile): {
  present: number;
  absent: number;
  late: number;
} {
  let present = 0;
  let absent = 0;
  let late = 0;
  for (const d of Object.values(file.days)) {
    if (d.status === "present") present++;
    else if (d.status === "absent") absent++;
    else if (d.status === "late") late++;
  }
  return { present, absent, late };
}

// In-memory cache with short TTL for month snapshots
const monthCache = new Map<string, { data: AttendanceMonthSnapshot; ts: number }>();
const MONTH_CACHE_TTL_MS = 60_000;

/**
 * Load the entire attendance snapshot of a class for a given month.
 * Returns all student JSON files under the month prefix.
 */
export async function loadClassMonth(
  classId: string,
  monthLike: string,
): Promise<AttendanceMonthSnapshot> {
  const month = normalizeMonth(monthLike);
  const cacheKey = `${classId}|${month}`;
  const cached = monthCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < MONTH_CACHE_TTL_MS) {
    return cached.data;
  }

  const prefix = `attendance/${classId}/${month}/`;
  const list = await s3.send(
    new ListObjectsV2Command({
      Bucket: vstorageConfig.bucket,
      Prefix: prefix,
    }),
  );

  const contents = list.Contents || [];
  const students: AttendanceMonthSnapshot["students"] = {};

  for (const obj of contents) {
    if (!obj.Key) continue;
    try {
      const res = await s3.send(
        new GetObjectCommand({
          Bucket: vstorageConfig.bucket,
          Key: obj.Key,
        }),
      );
      const body = res.Body as unknown;
      let jsonText: string | null = null;

      // Node runtime supports transformToString
      const hasTransform = !!(body as { transformToString?: () => Promise<string> })
        .transformToString;
      if (hasTransform) {
        jsonText = await (body as { transformToString: () => Promise<string> }).transformToString();
      } else {
        // Browser-like fallback (ReadableStream to text) – guarded
        throw new Error("Unsupported stream type from VStorage response");
      }

      if (jsonText) {
        const data = JSON.parse(jsonText) as AttendanceStudentMonthFile;
        if (data?.studentId) {
          students[data.studentId] = data;
        }
      }
    } catch (err) {
      console.error("attendanceService.loadClassMonth: failed to read", obj.Key, err);
      // continue reading other files
    }
  }

  const snapshot: AttendanceMonthSnapshot = { classId, month, students };
  monthCache.set(cacheKey, { data: snapshot, ts: Date.now() });
  return snapshot;
}

/**
 * Update a day status for a student and persist to vstorage as JSON.
 * Returns updated file.
 */
export async function setDayStatus(
  args: {
    classId: string;
    studentId: string;
    dateISO: string; // YYYY-MM-DD
    status: AttendanceStatus;
  },
  editorUserId: string,
): Promise<AttendanceStudentMonthFile> {
  const month = normalizeMonth(args.dateISO.slice(0, 7));
  const key = buildAttendanceKey(args.classId, month, args.studentId);

  let existing: AttendanceStudentMonthFile = {
    classId: args.classId,
    studentId: args.studentId,
    month,
    days: {},
  };

  try {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: vstorageConfig.bucket,
        Key: key,
      }),
    );
    const body = res.Body as unknown;
    const hasTransform = !!(body as { transformToString?: () => Promise<string> })
      .transformToString;
    if (hasTransform) {
      const text = await (body as { transformToString: () => Promise<string> }).transformToString();
      existing = JSON.parse(text) as AttendanceStudentMonthFile;
    }
  } catch {
    // If not found, we create new JSON
  }

  const next: AttendanceStudentMonthFile = {
    ...existing,
    days: {
      ...existing.days,
      [args.dateISO]: {
        status: args.status,
        meta: {
          editedAt: new Date().toISOString(),
          editedBy: editorUserId,
        },
      } satisfies AttendanceDay,
    },
  };

  const putBody = new Blob([JSON.stringify(next)], { type: "application/json" });
  await s3.send(
    new PutObjectCommand({
      Bucket: vstorageConfig.bucket,
      Key: key,
      Body: putBody,
      ContentType: "application/json",
      Metadata: {
        classId: args.classId,
        studentId: args.studentId,
        month,
        type: "attendance",
      },
    }),
  );

  // Invalidate cache for this month/class
  monthCache.delete(`${args.classId}|${month}`);
  return next;
}

/**
 * Get a simple per-day status map for quick UI use.
 */
export function buildDayStatusMap(
  snapshot: AttendanceMonthSnapshot,
  dateISO: string,
): Record<string, AttendanceStatus | undefined> {
  const map: Record<string, AttendanceStatus | undefined> = {};
  for (const [studentId, file] of Object.entries(snapshot.students)) {
    const day = file.days[dateISO];
    map[studentId] = day?.status;
  }
  return map;
}

import { userNotifications } from "../drizzle/schema";
import { getDb } from "./db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type InAppNotificationType = "account_plan" | "account_permission" | "quiz_approved" | "quiz_rejected";

export async function createInAppNotification(database: Database, input: {
  userId: number;
  type: InAppNotificationType;
  title: string;
  body: string;
  href?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await database.insert(userNotifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title.slice(0, 180),
    body: input.body,
    href: input.href ?? null,
    metadata: input.metadata,
  });
}

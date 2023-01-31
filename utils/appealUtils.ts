import { Submission } from "types";
import { AppealAttempt, AppealLog } from "@/types/appeal";

export function isSubmission(obj: any): obj is Submission {
  return (
    "assignment_config" in obj &&
    "assignment_config_id" in obj &&
    "checksum" in obj &&
    "created_at" in obj &&
    "id" in obj &&
    "isLate" in obj &&
    "reports" in obj &&
    "size" in obj &&
    "stored_name" in obj &&
    "updatedAt" in obj &&
    "upload_name" in obj &&
    "user" in obj &&
    "user_id" in obj
  );
}

export function isAppealAttempt(obj: any): obj is AppealAttempt {
  return "id" in obj && "submissionId" in obj && "createdAt" in obj && "latestStatus" in obj && "changeLog" in obj;
}

export function isAppealLog(obj: any): obj is AppealLog {
  return "id" in obj && "type" in obj && "date" in obj;
}

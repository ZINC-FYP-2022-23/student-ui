import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { AppealLog, AppealStatus, ChangeLogTypes } from "../../types/appeal";

export function AppealLogMessage({ log }: { log: AppealLog }) {
  const router = useRouter();
  const assignmentConfigId = parseInt(router.query.assignmentConfigId as string, 10);

  const now = new Date();
  const logDate = new Date(log.date);
  logDate.setTime(logDate.getTime() + 8 * 60 * 60 * 1000);
  if (log.type === "APPEAL_SUBMISSION") {
    return (
      <li>
        <div className="mx-12 h-12 border-l-2"></div>
        <div className="mx-8 flex justify-between">
          <div className="flex items-center">
            <div
              className="w-8 h-8 bg-blue-300 rounded-full flex justify-center items-center"
              data-flow="up"
              aria-label={`#${log.id}`}
            >
              <FontAwesomeIcon icon={["fad", "file"]} />
            </div>
            <p className="ml-2 text-sm text-gray-600">
              Your appeal was submitted on
              <span className="ml-1">
                {`${logDate.toLocaleDateString("en-HK", {
                  month: "short",
                  day: "numeric",
                  ...(logDate.getFullYear() !== now.getFullYear() && { year: "numeric" }),
                })} at ${logDate.toLocaleTimeString().toLowerCase()}`}
              </span>
            </p>
          </div>
          <span className="inline-flex rounded-md shadow-sm">
            <Link href={`/appeals/${log.id}`}>
              <a className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
                View Appeal
              </a>
            </Link>
          </span>
        </div>
      </li>
    );
  }

  if (log.type === ChangeLogTypes.APPEAL_STATUS) {
    return (
      <li>
        <div className="mx-12 h-12 border-l-2"></div>
        <div className="mx-8 flex justify-between">
          <div className="flex items-center">
            <div
              className="w-8 h-8 bg-yellow-300 rounded-full flex justify-center items-center"
              data-flow="up"
              aria-label={`#${log.id}`}
            >
              <FontAwesomeIcon icon={["fad", "gavel"]} />
            </div>
            <p className="ml-2 text-sm text-gray-600">
              The appeal status has been updated on
              <span className="ml-1">
                {`${logDate.toLocaleDateString("en-HK", {
                  month: "short",
                  day: "numeric",
                  ...(logDate.getFullYear() !== now.getFullYear() && { year: "numeric" }),
                })} at ${logDate.toLocaleTimeString().toLowerCase()}`}
              </span>
              {log.updatedState === AppealStatus.Accept && (
                <p className="ml-2 text-sm text-green-600">Your appeal has been accepted</p>
              )}
              {log.updatedState === AppealStatus.Reject && (
                <p className="ml-2 text-sm text-red-600">Your appeal has been rejected</p>
              )}
              {log.updatedState === AppealStatus.Pending && (
                <p className="ml-2 text-sm text-yellow-600">Your appeal has been set to pending</p>
              )}
            </p>
          </div>
          <span className="inline-flex rounded-md shadow-sm">
            <Link href={`/${assignmentConfigId}/${log.id}`}>
              <a className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
                View Appeal
              </a>
            </Link>
          </span>
        </div>
      </li>
    );
  }

  // TODO(BRYAN): Display Appeal Log when `appeal.type` in SCORE and SUBMISSION

  return (
    <li>
      <div className="mx-12 h-12 border-l-2"></div>
      <div className="mx-8 flex justify-between">
        <div className="flex items-center">
          <div
            className="w-8 h-8 bg-blue-300 rounded-full flex justify-center items-center"
            data-flow="up"
            aria-label={`#${log.id}`}
          >
            <FontAwesomeIcon icon={["fad", "exclamation"]} />
          </div>
          <p className="ml-2 text-sm text-gray-600">ERROR: Log cannot be identified and shown.</p>
        </div>
      </div>
    </li>
  );
}

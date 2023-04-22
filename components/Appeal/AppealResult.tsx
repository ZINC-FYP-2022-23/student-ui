import { AppealStatus } from "@/types/appeal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface AppealResultProps {
  /** The latest appeal status. */
  appealResult: AppealStatus;
  /** Whether to add padding around the status. Defaults to false. */
  hasPadding?: boolean;
}

const paddingBgColor: Record<AppealStatus, string> = {
  [AppealStatus.ACCEPTED]: "bg-green-50",
  [AppealStatus.REJECTED]: "bg-red-50",
  [AppealStatus.PENDING]: "bg-yellow-50",
};

/**
 * Returns a component of a box that shows the latest appeal status.
 */
function AppealResult({ appealResult, hasPadding = false }: AppealResultProps) {
  let icon: React.ReactNode | null = null;
  let label: React.ReactNode | null = null;

  switch (appealResult) {
    case AppealStatus.ACCEPTED:
      icon = <FontAwesomeIcon icon={["far", "check"]} className="text-green-600" />;
      label = <span className="text-green-600">Appeal Accepted</span>;
      break;

    case AppealStatus.REJECTED:
      icon = <FontAwesomeIcon icon={["far", "xmark"]} className="text-red-600" />;
      label = <span className="text-red-600">Appeal Rejected</span>;
      break;

    case AppealStatus.PENDING:
      icon = <FontAwesomeIcon icon={["far", "clock"]} className="text-yellow-600" />;
      label = <span className="text-yellow-600">Pending Appeal...</span>;
      break;
  }

  const result = (
    <div className="flex items-center justify-center gap-2 text-lg">
      {icon}
      {label && <p className="text-lg font-medium">{label}</p>}
    </div>
  );

  return hasPadding ? <div className={`py-3 rounded-md ${paddingBgColor[appealResult]}`}>{result}</div> : result;
}

export default AppealResult;

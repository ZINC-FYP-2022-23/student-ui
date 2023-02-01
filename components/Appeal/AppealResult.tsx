import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppealStatus } from "../../types/appeal";

export function AppealResult({ appealResult }: { appealResult: AppealStatus }) {
  switch (appealResult) {
    case AppealStatus.Accept: {
      return (
        <div className="flex flex-col items-center rounded-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={["far", "check"]} className="text-green-600 mr-2 text-lg" />
            <p className="text-green-600 text-lg font-medium">Appeal Accepted</p>
          </div>
        </div>
      );
      break;
    }
    case AppealStatus.Reject: {
      return (
        <div className="flex flex-col items-center rounded-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={["far", "xmark"]} className="text-red-600 mr-2 text-lg" />
            <p className="text-red-600 text-lg font-medium">Appeal Rejected</p>
          </div>
        </div>
      );
      break;
    }
    case AppealStatus.Pending: {
      return (
        <div className="flex flex-col items-center rounded-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={["far", "clock"]} className="text-yellow-600 mr-2 text-lg" />
            <p className="text-yellow-600 text-lg font-medium">Pending Appeal...</p>
          </div>
        </div>
      );
      break;
    }
    default: {
      return (
        <div>
          <p className="text-lg">Error: AppealStatus Undefined</p>
        </div>
      );
      break;
    }
  }
}

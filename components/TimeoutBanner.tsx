interface TimeoutBannerProps {
  stageName?: string;
  hidden: boolean;
}

export function TimeoutBanner({ stageName, hidden }: TimeoutBannerProps) {
  return (
    <div className={`rounded-md bg-red-100 p-2 mt-2 mx-4 ${hidden ? "hidden" : "block"}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm leading-5 font-medium text-red-800">{stageName ?? "Stage"} has timed out</h3>
        </div>
      </div>
    </div>
  );
}

import { useLayoutDispatch } from "@/contexts/layout";
import { isInputEmpty } from "@/utils/appealUtils";
import axios from "axios";
import { useRouter } from "next/router";

interface AppealMessageButtonProps {
  /** The text message sent to the TA when submitting the appeal. */
  message: string;
  /** The student's user ID. */
  userId: number;
  /** Callback when the message is sent successfully. */
  onSuccess?: () => void;
}

/**
 * The "Send Message" button to send a message in the appeal details page.
 */
function AppealMessageButton({ userId, message, onSuccess }: AppealMessageButtonProps) {
  const dispatch = useLayoutDispatch();
  const router = useRouter();
  const { appealId } = router.query;

  return (
    <button
      className="px-4 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 active:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition ease-in-out duration-150"
      // Disable the Send Message Button if the text editor is empty
      disabled={isInputEmpty(message)}
      onClick={async () => {
        // Check if the text message blank. The student should filled in something for the appeal.
        if (isInputEmpty(message)) {
          alert("Cannot submit empty message");
        } else {
          try {
            await axios({
              method: "POST",
              url: `/api/appeals/messages`,
              data: {
                message,
                senderId: userId,
                appealId,
              },
            });

            onSuccess?.();
            return;
          } catch (error: any) {
            const { status: statusCode, data: responseJson } = error.response;
            if (statusCode === 403) {
              // 403 Forbidden
              dispatch({
                type: "showNotification",
                payload: {
                  title: "Appeal message denied",
                  message: responseJson.error,
                  success: false,
                },
              });
              return;
            }
            dispatch({
              type: "showNotification",
              payload: {
                title: "Unable to send appeal message",
                message: "Failed to send appeal message due to network/server issues. Please submit again.\n" + error,
                success: false,
              },
            });
          }
        }
      }}
    >
      Send Message
    </button>
  );
}

export default AppealMessageButton;

import { ApolloProvider } from "@apollo/client";
import { parse } from "cookie";
import { config as faConfig, library } from "@fortawesome/fontawesome-svg-core";
import { fad } from "@fortawesome/pro-duotone-svg-icons";
import { far } from "@fortawesome/pro-regular-svg-icons";
import { useApollo } from "../lib/apollo";
import { ZincProvider } from "../contexts/zinc";
import toast from "react-hot-toast";
import { Notification, NotificationBody } from "../components/Notification";

import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-gh-like-diff/dist/css/diff2html.min.css";
import "../styles/index.css";

faConfig.autoAddCss = false;
library.add(fad, far);

function ZincApp({ Component, pageProps, user, semester, cookie }) {
  let initialApolloState = {};
  if (pageProps) {
    initialApolloState = pageProps.initialApolloState;
  }
  const client = useApollo(cookie, initialApolloState);

  try {
    return (
      <ApolloProvider client={client}>
        <ZincProvider user={user} semester={semester}>
          <Component {...pageProps} />
        </ZincProvider>
      </ApolloProvider>
    );
  } catch (error: any) {
    toast.custom((t) => (
      <Notification trigger={t}>
        <NotificationBody title={"Error"} body={error.message} success={false} id={t.id} />
      </Notification>
    ));
  }
}

ZincApp.getInitialProps = async ({ ctx }) => {
  const { user, semester } = parse(ctx.req.headers.cookie);
  return {
    cookie: ctx.req.headers.cookie,
    user: parseInt(user, 10),
    semester: parseInt(semester, 10),
  };
};

export default ZincApp;

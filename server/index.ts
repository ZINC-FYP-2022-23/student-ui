import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import next from "next";
import oauth from "./oauth";
import { loadEnvConfig } from "@next/env";

declare module "express" { 
  export interface Response {
    openid?: any
  }
}

const dev = process.env.NODE_ENV !== "production";
loadEnvConfig(process.cwd(), dev);

const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

(async () => {
  try {
    await app.prepare();
    const server = express();
    server.enable('trust proxy');
    server.use(cors());
    server.use(oauth);

    server.get('/logout', (req: Request, res: Response) => {
      // @ts-ignore
      req.appSession!.destroy((err) => {
        if (err) {
          console.error(err);
        }
        res.oidc!.logout({ returnTo: process.env.POST_LOGOUT_REDIRECT_URI });
      });
      res.oidc!.logout({ returnTo: process.env.POST_LOGOUT_REDIRECT_URI });

    });
    // server.get('/service-worker.js', (req, res) => {
    //   app.serveStatic(req, res, './.next/service-worker.js')
    // });

    // const serviceWorkers = [
    //   {
    //     filename: 'service-worker.js',
    //     path: './.next/service-worker.js',
    //   },
    //   {
    //     filename: 'firebase-messaging-sw.js',
    //     path: './public/fcm-sw.js',
    //   },
    // ]
    // serviceWorkers.forEach(({ filename, path }) => {
    //   server.get(`/${filename}`, (req, res) => {
    //     app.serveStatic(req, res, path)
    //   })
    // });

    server.all('*', (req: Request, res: Response) => handle(req, res));
    server.listen(port, (err?: any) => {
      if (err) throw err;
      console.log(`> Ready on localhost:${port} - env ${process.env.NODE_ENV}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

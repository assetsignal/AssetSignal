import { createApp } from "../server.ts";

let appPromise: Promise<any> | null = null;

export default async function handler(req: any, res: any) {
  if (!appPromise) {
    appPromise = createApp({ includeFrontend: false });
  }
  const app = await appPromise;
  return app(req, res);
}

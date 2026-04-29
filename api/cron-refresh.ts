import { clearCache } from "./_lib/cache";
import { apiFetch } from "./_lib/fetcher";

const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req: Request): Promise<Response> {
  if (req.headers.get("Authorization") !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    clearCache();

    Promise.all([
      apiFetch("/launch/upcoming/?format=json&mode=detailed&limit=40"),
      apiFetch("/launch/previous/?format=json&mode=detailed&limit=40&ordering=-net"),
      apiFetch("/agencies/?format=json&featured=true&limit=30"),
    ]);

    return Response.json({ refreshed: true, timestamp: Date.now() });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

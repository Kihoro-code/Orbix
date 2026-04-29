import { apiFetch } from "./_lib/fetcher";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await apiFetch<PaginatedResponse<unknown>>(
      "/agencies/?format=json&featured=true&limit=30",
    );

    return Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Vercel-CDN-Cache-Control": "max-age=3600",
      },
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

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
    const url = new URL(req.url);
    let limit = parseInt(url.searchParams.get("limit") ?? "20");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");
    const search = url.searchParams.get("search") ?? "";
    const agency = url.searchParams.get("agency") ?? "";
    const dateFrom = url.searchParams.get("dateFrom") ?? "";
    const dateTo = url.searchParams.get("dateTo") ?? "";

    limit = Math.min(limit, 40);

    const params = new URLSearchParams({
      format: "json",
      mode: "detailed",
      limit: String(limit),
      offset: String(offset),
      ordering: "-net",
    });

    if (search) params.set("search", search);
    if (agency) params.set("lsp__name", agency);
    if (dateFrom) params.set("net__gte", dateFrom);
    if (dateTo) params.set("net__lte", dateTo);

    const data = await apiFetch<PaginatedResponse<unknown>>(
      `/launch/previous/?${params.toString()}`,
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

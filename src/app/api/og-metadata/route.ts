import { NextResponse } from "next/server";
import ogs from "open-graph-scraper";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const { result, error } = await ogs({ url, timeout: 10000 });

    if (error) {
      // Return minimal data even if OG scraping fails
      return NextResponse.json({
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogSiteName: null,
      });
    }

    // Extract the first image URL if available
    let ogImage: string | null = null;
    if (result.ogImage && result.ogImage.length > 0) {
      ogImage = result.ogImage[0].url;
    }

    return NextResponse.json({
      ogTitle: result.ogTitle ?? null,
      ogDescription: result.ogDescription ?? null,
      ogImage,
      ogSiteName: result.ogSiteName ?? null,
    });
  } catch (error) {
    console.error("OG metadata error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}

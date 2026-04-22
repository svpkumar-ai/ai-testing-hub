import { Router, type IRouter } from "express";
import { GetNewsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

interface RssArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  isRelevantToDevTesting: boolean;
  starred: boolean;
  viewCount: number;
  likeCount: number;
  tags: string[];
}

const AI_TESTING_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "machine learning",
  "llm",
  "large language model",
  "gpt",
  "claude",
  "gemini",
  "copilot",
  "agent",
  "automation",
  "automated",
  "playwright",
  "selenium",
  "cypress",
  "test automation",
  "ai testing",
  "generative",
  "chatgpt",
  "openai",
  "prompt",
  "nlp",
  "neural",
  "deep learning",
  "model",
  "intelligent",
];

function isAiRelated(title: string, description: string): boolean {
  const text = (title + " " + description).toLowerCase();
  return AI_TESTING_KEYWORDS.some((kw) => text.includes(kw));
}

function extractTags(title: string, description: string): string[] {
  const text = (title + " " + description).toLowerCase();
  const tags: string[] = [];

  if (
    text.includes("playwright") ||
    text.includes("selenium") ||
    text.includes("cypress") ||
    text.includes("webdriver") ||
    text.includes("appium")
  )
    tags.push("Test Framework");
  if (
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("machine learning") ||
    text.includes("llm") ||
    text.includes("gpt") ||
    text.includes("copilot") ||
    text.includes("generative")
  )
    tags.push("AI");
  if (
    text.includes("automation") ||
    text.includes("automated") ||
    text.includes("automate")
  )
    tags.push("Automation");
  if (
    text.includes("api test") ||
    text.includes("rest api") ||
    text.includes("postman") ||
    text.includes("api automation")
  )
    tags.push("API Testing");
  if (
    text.includes("performance") ||
    text.includes("load test") ||
    text.includes("k6") ||
    text.includes("jmeter") ||
    text.includes("gatling")
  )
    tags.push("Performance");
  if (
    text.includes("mobile") ||
    text.includes("android") ||
    text.includes("ios") ||
    text.includes("appium")
  )
    tags.push("Mobile");
  if (
    text.includes("ci/cd") ||
    text.includes("cicd") ||
    text.includes("pipeline") ||
    text.includes("jenkins") ||
    text.includes("github actions")
  )
    tags.push("CI/CD");
  if (
    text.includes("security test") ||
    text.includes("penetration") ||
    text.includes("vulnerability")
  )
    tags.push("Security Testing");
  if (text.includes("tutorial") || text.includes("course") || text.includes("learn"))
    tags.push("Tutorial");
  if (
    text.includes("agent") ||
    text.includes("autonomous") ||
    text.includes("agentic")
  )
    tags.push("AI Agents");

  return tags;
}

interface CachedData {
  articles: RssArticle[];
  fetchedAt: number;
}

let newsCache: CachedData | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — matches the cron job schedule

// YouTube channels defined by handle (stable) + known channel ID (cached)
const YOUTUBE_CHANNELS = [
  // ── Software Testing channels ──────────────────────────────────────────────
  { handle: "@ExecuteAutomation",       channelId: "UCO1aucBAJgFR8odzfXOZ5uw", source: "▶ ExecuteAutomation" },
  { handle: "@RahulShettyAcademy",      channelId: "UCgx5SDcUQWCQ_1CNneQzCRw", source: "▶ Rahul Shetty Academy" },
  { handle: "@NaveenAutomationLabs",    channelId: "UCXJKOPxx4O1f63nnfsoiEug", source: "▶ Naveen AutomationLabs" },
  { handle: "@MukeshOtwani",            channelId: "UCcTII5pbZYkU4fgFtb4uesg", source: "▶ Mukesh Otwani" },
  { handle: "@Chase-H-AI",              channelId: "UCoy6cTJ7Tg0dqS-DI-_REsA", source: "▶ Chase AI" },
  { handle: "@aiwithbrandon",           channelId: "UCEzrs7gK6Nf6t_tadEprzxQ", source: "▶ aiwithbrandon" },
  { handle: "@SDET-QA",                 channelId: "UC46vj6mN-6kZm5RYWWqebsg", source: "▶ SDET Pavan" },
  { handle: "@AutomationStepByStep",    channelId: "UCTt7pyY-o0eltq14glaG5dg", source: "▶ Automation Step By Step" },
  { handle: "@TestingMinibytes",        channelId: "UC6PTXUHb6j4Oxf0ccdRI11A", source: "▶ Testing Mini Bytes" },
  { handle: "@thetestingacademy",       channelId: "UCc8x1YwoLl-4WLo5imVrgdw", source: "▶ The Testing Academy" },
  { handle: "@TestMuAI",                channelId: "UCCymWVaTozpEng_ep0mdUyw",  source: "▶ TestMu AI" },
  { handle: "@SoftwareTestingMentor",   channelId: "UCzOMBStlSDfyai6rWdK3hWw", source: "▶ Software Testing Mentor" },
  // ── AI / Developer channels ────────────────────────────────────────────────
  { handle: "@mreflow",                 channelId: "UChpleBmo18P08aKCIgti38g", source: "▶ Matt Wolfe" },
  { handle: "@Fireship",                channelId: "UCsBjURrPoezykLs9EqgamOA", source: "▶ Fireship" },
  { handle: "@matthew_berman",          channelId: "UCawZsQWqfGSbCI5yjkdVkTA", source: "▶ Matthew Berman" },
  { handle: "@AIJasonZ",                channelId: "UCrXSVX9a1mj8l0CMLwKgMVw", source: "▶ AI Jason" },
  { handle: "@samwitteveenai",          channelId: "UC55ODQSvARtgSyc8ThfiepQ", source: "▶ Sam Witteveen AI" },
  { handle: "@aiadvantage",             channelId: "UCHhYXsLBEVVnbvsq57n1MTQ", source: "▶ The AI Advantage" },
  { handle: "@LiamOttley",              channelId: "UCui4jxDaMb53Gdh-AZUTPAg", source: "▶ Liam Ottley" },
  { handle: "@daveebbelaar",            channelId: "UCn8ujwUInbJkBhffxqAPBVQ", source: "▶ Dave Ebbelaar" },
];

// Blog feeds used as fallback when YOUTUBE_API_KEY is absent and YouTube RSS is blocked.
// These reliably serve AI/testing content from Vercel's shared IPs.
const FALLBACK_BLOG_FEEDS = [
  { url: "https://applitools.com/blog/feed/",             source: "Applitools Blog" },
  { url: "https://www.browserstack.com/blog/rss/",        source: "BrowserStack Blog" },
  { url: "https://www.softwaretestinghelp.com/feed/",     source: "Software Testing Help" },
  { url: "https://katalon.com/resources-center/blog/rss.xml", source: "Katalon Blog" },
];

// In-memory cache of resolved channel IDs — survives across cache refreshes
// but resets on server restart (that's intentional so stale IDs get re-resolved)
const resolvedChannelIds = new Map<string, string>();

const YOUTUBE_UA =
  "Mozilla/5.0 (compatible; Feedfetcher-Google; +http://www.google.com/feedfetcher.html)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .trim();
}

function parseXmlFeed(xml: string, sourceName: string): RssArticle[] {
  const items: RssArticle[] = [];

  // Try RSS <item> format first
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);
  for (const match of itemMatches) {
    const item = match[1];
    const titleMatch = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/s);
    const linkMatch = item.match(/<link[^>]*>(.*?)<\/link>|<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/s);
    const descMatch = item.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description[^>]*>([\s\S]*?)<\/description>/s);
    const pubDateMatch = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/s);

    const title = decodeHtmlEntities(titleMatch?.[1] ?? titleMatch?.[2] ?? "");
    const itemUrl = (linkMatch?.[1] ?? linkMatch?.[2] ?? "").trim();
    const description = decodeHtmlEntities(descMatch?.[1] ?? descMatch?.[2] ?? "").slice(0, 300);
    const publishedAt = pubDateMatch?.[1]?.trim() ?? new Date().toISOString();

    if (!title || !itemUrl) continue;
    const id = Buffer.from(itemUrl).toString("base64url");
    items.push({ id, title, description: description || "No description available.", url: itemUrl, source: sourceName, publishedAt, isRelevantToDevTesting: isAiRelated(title, description), starred: false, viewCount: 0, likeCount: 0, tags: extractTags(title, description) });
    if (items.length >= 15) break;
  }

  // Fall back to Atom <entry> format (YouTube uses this)
  if (items.length === 0) {
    const entryMatches = xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/gi);
    for (const match of entryMatches) {
      const entry = match[1];
      const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/s);
      const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
      const descMatch =
        entry.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/s) ||
        entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/s) ||
        entry.match(/<content[^>]*>([\s\S]*?)<\/content>/s);
      const pubMatch =
        entry.match(/<published[^>]*>(.*?)<\/published>/s) ||
        entry.match(/<updated[^>]*>(.*?)<\/updated>/s);

      const title = decodeHtmlEntities(titleMatch?.[1] ?? "");
      const itemUrl = (linkMatch?.[1] ?? "").trim();
      const description = decodeHtmlEntities(descMatch?.[1] ?? "").slice(0, 300);
      const publishedAt = pubMatch?.[1]?.trim() ?? new Date().toISOString();

      if (!title || !itemUrl) continue;
      const id = Buffer.from(itemUrl).toString("base64url");
      items.push({ id, title, description: description || "No description available.", url: itemUrl, source: sourceName, publishedAt, isRelevantToDevTesting: isAiRelated(title, description), starred: false, viewCount: 0, likeCount: 0, tags: extractTags(title, description) });
      if (items.length >= 15) break;
    }
  }

  return items;
}

async function fetchRssFeed(url: string, sourceName: string): Promise<RssArticle[]> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": YOUTUBE_UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    return parseXmlFeed(await response.text(), sourceName);
  } catch {
    return [];
  }
}

// Derive uploads playlist ID from channel ID (UC... → UU...)
function uploadsPlaylistId(channelId: string): string {
  return "UU" + channelId.slice(2);
}

// Fetch video statistics (viewCount, likeCount) in a single batch call.
// Costs 1 quota unit per call regardless of how many video IDs are passed.
async function fetchVideoStats(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, { viewCount: number; likeCount: number }>> {
  const statsMap = new Map<string, { viewCount: number; likeCount: number }>();
  if (videoIds.length === 0) return statsMap;
  try {
    const ids = videoIds.join(",");
    const url =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=statistics&id=${ids}&key=${apiKey}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[fetchVideoStats] HTTP ${resp.status}: ${body.slice(0, 200)}`);
      return statsMap;
    }
    const data = await resp.json() as {
      items?: Array<{ id: string; statistics: { viewCount?: string; likeCount?: string } }>;
    };
    for (const item of data.items ?? []) {
      statsMap.set(item.id, {
        viewCount: parseInt(item.statistics.viewCount ?? "0", 10) || 0,
        likeCount: parseInt(item.statistics.likeCount ?? "0", 10) || 0,
      });
    }
  } catch (e) { console.error("[fetchVideoStats] error:", e); }
  return statsMap;
}

// Fetch recent videos for a channel using YouTube Data API v3.
// Returns articles with viewCount=0/likeCount=0 — stats are applied in
// a single batched call in fetchAllNews after all channels are collected.
async function fetchYouTubeViaApi(
  channel: { channelId: string; source: string },
  apiKey: string
): Promise<RssArticle[]> {
  try {
    const playlistId = uploadsPlaylistId(channel.channelId);
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=snippet&playlistId=${playlistId}&maxResults=15&key=${apiKey}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[fetchYouTubeViaApi] ${channel.source} HTTP ${resp.status}: ${body.slice(0, 400)}`);
      return [];
    }
    const data = await resp.json() as { items?: Array<{ snippet: { title: string; description: string; publishedAt: string; resourceId: { videoId: string } } }> };
    const rawItems = data.items ?? [];

    return rawItems.map((item) => {
      const { title, description, publishedAt, resourceId } = item.snippet;
      const videoId = resourceId.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const desc = (description ?? "").slice(0, 300) || "No description available.";
      return {
        id: videoId,
        title: decodeHtmlEntities(title),
        description: decodeHtmlEntities(desc),
        url: videoUrl,
        source: channel.source,
        publishedAt,
        isRelevantToDevTesting: isAiRelated(title, description),
        starred: false,
        viewCount: 0,
        likeCount: 0,
        tags: extractTags(title, description),
      } as RssArticle;
    });
  } catch (e) {
    console.error(`[fetchYouTubeViaApi] ${channel.source} error:`, e);
    return [];
  }
}


async function fetchAllNews(force = false): Promise<RssArticle[]> {
  if (!force && newsCache && Date.now() - newsCache.fetchedAt < CACHE_TTL_MS) {
    return newsCache.articles;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  // Fetch all channel playlists in parallel when using the API (no rate-limit risk).
  // Fall back to sequential with gaps for RSS (IP-level rate limiting).
  const freshArticles: RssArticle[] = [];
  if (apiKey) {
    const results = await Promise.allSettled(
      YOUTUBE_CHANNELS.map((ch) => fetchYouTubeViaApi(ch, apiKey))
    );
    for (const r of results) {
      if (r.status === "fulfilled") freshArticles.push(...r.value);
    }

    // One batched stats call for all video IDs across all channels.
    // YouTube allows up to 50 IDs per request; split into chunks if needed.
    const allVideoIds = freshArticles.map((a) => a.id).filter(Boolean);
    const CHUNK = 50;
    const statsMap = new Map<string, { viewCount: number; likeCount: number }>();
    for (let i = 0; i < allVideoIds.length; i += CHUNK) {
      const chunk = allVideoIds.slice(i, i + CHUNK);
      const partial = await fetchVideoStats(chunk, apiKey);
      for (const [k, v] of partial) statsMap.set(k, v);
    }
    for (const article of freshArticles) {
      const stats = statsMap.get(article.id);
      if (stats) {
        article.viewCount = stats.viewCount;
        article.likeCount = stats.likeCount;
      }
    }
  } else {
    // No API key — fetch via RSS sequentially with gaps to avoid IP rate limits
    for (let i = 0; i < YOUTUBE_CHANNELS.length; i++) {
      if (i > 0) await sleep(3000);
      const ch = YOUTUBE_CHANNELS[i];
      const currentId = resolvedChannelIds.get(ch.handle) ?? ch.channelId;
      const articles = await fetchRssFeed(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${currentId}`,
        ch.source
      );
      if (articles.length > 0) resolvedChannelIds.set(ch.handle, currentId);
      freshArticles.push(...articles);
    }
  }

  // When YouTube yields nothing (no API key + RSS blocked on shared IPs),
  // fall back to curated blog feeds so the page is never empty.
  if (freshArticles.length === 0) {
    const blogResults = await Promise.allSettled(
      FALLBACK_BLOG_FEEDS.map((f) => fetchRssFeed(f.url, f.source))
    );
    for (const r of blogResults) {
      if (r.status === "fulfilled") freshArticles.push(...r.value);
    }
  }

  // Keep only AI/automation-relevant content
  const aiFiltered = freshArticles.filter((a) => a.isRelevantToDevTesting);

  // Merge with previous cache (keeps articles from channels that failed this cycle)
  const previousArticles = newsCache?.articles ?? [];
  const merged = [...aiFiltered, ...previousArticles];

  // Sort by date, newest first
  merged.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return isNaN(dateA) ? 1 : isNaN(dateB) ? -1 : dateB - dateA;
  });

  // Deduplicate by URL (fresh articles win since they appear first)
  const seen = new Set<string>();
  const deduped = merged.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // Cap at 50 articles per source (newest kept, oldest dropped)
  const MAX_PER_SOURCE = 50;
  const perSourceCount = new Map<string, number>();
  const capped = deduped.filter((a) => {
    const count = perSourceCount.get(a.source) ?? 0;
    if (count >= MAX_PER_SOURCE) return false;
    perSourceCount.set(a.source, count + 1);
    return true;
  });

  // Global starring: mark top-15 articles by combined engagement (views + likes×100)
  // across ALL channels so the most popular content surfaces regardless of source.
  const TOP_STARRED = 15;
  const byEngagement = [...capped].sort(
    (a, b) => (b.viewCount + b.likeCount * 100) - (a.viewCount + a.likeCount * 100)
  );
  const starredIds = new Set(byEngagement.slice(0, TOP_STARRED).map((a) => a.id));
  const final = capped.map((a) => ({ ...a, starred: starredIds.has(a.id) }));

  newsCache = { articles: final, fetchedAt: Date.now() };
  return final;
}

// Temporary debug endpoint — tests one channel and one stats call to surface API errors
router.get("/news/debug", async (_req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) { res.json({ error: "YOUTUBE_API_KEY not set" }); return; }

  const ch = YOUTUBE_CHANNELS[0];
  const playlistId = uploadsPlaylistId(ch.channelId);
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=3&key=${apiKey}`;
  const playlistResp = await fetch(playlistUrl, { signal: AbortSignal.timeout(10000) });
  const playlistBody = await playlistResp.text();

  let statsBody = "not attempted";
  const playlistData = JSON.parse(playlistBody) as { items?: Array<{ snippet: { resourceId: { videoId: string } } }> };
  const videoId = playlistData.items?.[0]?.snippet?.resourceId?.videoId;
  if (videoId) {
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
    const statsResp = await fetch(statsUrl, { signal: AbortSignal.timeout(10000) });
    statsBody = await statsResp.text();
  }

  res.json({
    channel: ch.source,
    apiKeyPresent: true,
    apiKeyPrefix: apiKey.slice(0, 6) + "...",
    playlistStatus: playlistResp.status,
    playlistBody: JSON.parse(playlistBody),
    videoId,
    statsBody: statsBody === "not attempted" ? statsBody : JSON.parse(statsBody),
  });
});

router.get("/news", async (req, res) => {
  const parsed = GetNewsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const force = req.query.force === "true";

  const articles = await fetchAllNews(force);
  const total = articles.length;
  const start = (page - 1) * limit;
  const paged = articles.slice(start, start + limit);

  res.json({ articles: paged, total, page, limit });
});

export default router;

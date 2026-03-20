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
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

async function fetchRssFeed(
  url: string,
  sourceName: string
): Promise<RssArticle[]> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "AI-Testing-Hub/1.0 RSS Reader" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const xml = await response.text();

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

      const id = Buffer.from(itemUrl).toString("base64").slice(0, 32);
      items.push({
        id,
        title,
        description: description || "No description available.",
        url: itemUrl,
        source: sourceName,
        publishedAt,
        isRelevantToDevTesting: isAiRelated(title, description),
        tags: extractTags(title, description),
      });

      if (items.length >= 15) break;
    }

    // If no RSS items found, try Atom <entry> format (YouTube uses this)
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

        const id = Buffer.from(itemUrl).toString("base64").slice(0, 32);
        items.push({
          id,
          title,
          description: description || "No description available.",
          url: itemUrl,
          source: sourceName,
          publishedAt,
          isRelevantToDevTesting: isAiRelated(title, description),
          tags: extractTags(title, description),
        });

        if (items.length >= 15) break;
      }
    }

    return items;
  } catch {
    return [];
  }
}

async function fetchAllNews(): Promise<RssArticle[]> {
  if (newsCache && Date.now() - newsCache.fetchedAt < CACHE_TTL_MS) {
    return newsCache.articles;
  }

  const feeds = [
    // ── YouTube: Software Testing Channels ──────────────────────────────
    {
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCO1aucBAJgFR8odzfXOZ5uw",
      source: "▶ ExecuteAutomation",
    },
    {
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCgx5SDcUQWCQ_1CNneQzCRw",
      source: "▶ Rahul Shetty Academy",
    },
    {
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCXJKOPxx4O1f63nnfsoiEug",
      source: "▶ Naveen AutomationLabs",
    },
    {
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCH5Lo7qKaAsoN4OXAsNoBbA",
      source: "▶ QAFox",
    },
    {
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCcTII5pbZYkU4fgFtb4uesg",
      source: "▶ Mukesh Otwani",
    },
    {
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCoy6cTJ7Tg0dqS-DI-_REsA",
      source: "▶ Chase AI",
    },
    {
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCEzrs7gK6Nf6t_tadEprzxQ",
      source: "▶ aiwithbrandon",
    },

    // ── Blogs & News ────────────────────────────────────────────────────
    {
      url: "https://www.ministryoftesting.com/feed",
      source: "Ministry of Testing",
    },
    {
      url: "https://www.softwaretestinghelp.com/feed/",
      source: "Software Testing Help",
    },
    {
      url: "https://applitools.com/blog/feed/",
      source: "Applitools Blog",
    },
    {
      url: "https://www.browserstack.com/blog/feed/",
      source: "BrowserStack Blog",
    },
    {
      url: "https://www.katalon.com/resources-center/blog/feed/",
      source: "Katalon Blog",
    },
    {
      url: "https://www.softwaretestingmagazine.com/feed/",
      source: "Testing Magazine",
    },
  ];

  const results = await Promise.allSettled(
    feeds.map((f) => fetchRssFeed(f.url, f.source))
  );

  const freshArticles: RssArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      freshArticles.push(...result.value);
    }
  }

  // Merge fresh articles with whatever was previously cached so older
  // articles are never wiped — only the oldest eventually fall off.
  const previousArticles = newsCache?.articles ?? [];
  const merged = [...freshArticles, ...previousArticles];

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

  newsCache = { articles: capped, fetchedAt: Date.now() };
  return capped;
}

router.get("/news", async (req, res) => {
  const parsed = GetNewsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  const articles = await fetchAllNews();
  const total = articles.length;
  const start = (page - 1) * limit;
  const paged = articles.slice(start, start + limit);

  res.json({ articles: paged, total, page, limit });
});

export default router;

import { useGetNews, getGetNewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { NewsCard } from "@/components/news-card";
import { Loader2, RefreshCw, Play, BookOpen } from "lucide-react";
import { Button, cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useGetNews(
    { page: 1, limit: 50 },
    {
      query: {
        queryKey: getGetNewsQueryKey({ page: 1, limit: 50 }),
        staleTime: 1000 * 60 * 1,
      },
    }
  );

  async function handleForceRefresh() {
    await fetch("/api/news?force=true");
    await queryClient.invalidateQueries({
      queryKey: getGetNewsQueryKey({ page: 1, limit: 50 }),
    });
  }

  const sources = useMemo(() => {
    if (!data?.articles) return [];
    const map = new Map<string, number>();
    for (const a of data.articles) {
      map.set(a.source, (map.get(a.source) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }));
  }, [data?.articles]);

  const youtubeChannels = sources.filter((s) => s.source.startsWith("▶"));
  const blogSources = sources.filter((s) => !s.source.startsWith("▶"));

  const filteredArticles = useMemo(() => {
    if (!data?.articles) return [];
    if (!selectedChannel) return data.articles;
    return data.articles.filter((a) => a.source === selectedChannel);
  }, [data?.articles, selectedChannel]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-grow flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/10 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-3 py-5 space-y-5">
            {/* All Channels */}
            <button
              onClick={() => setSelectedChannel(null)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                !selectedChannel
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <span>All Channels</span>
              {data?.articles && (
                <span className={cn(
                  "text-xs rounded-full px-1.5 py-0.5",
                  !selectedChannel ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                )}>
                  {data.articles.length}
                </span>
              )}
            </button>

            {/* YouTube Channels */}
            {youtubeChannels.length > 0 && (
              <div>
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="h-3 w-3" />
                  YouTube
                </p>
                <ul className="space-y-0.5">
                  {youtubeChannels.map(({ source, count }) => {
                    const label = source.replace("▶ ", "");
                    const isActive = selectedChannel === source;
                    return (
                      <li key={source}>
                        <button
                          onClick={() => setSelectedChannel(isActive ? null : source)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          <span className="truncate text-left">{label}</span>
                          <span className={cn(
                            "ml-2 shrink-0 text-xs rounded-full px-1.5 py-0.5",
                            isActive ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                          )}>
                            {count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Blog Sources */}
            {blogSources.length > 0 && (
              <div>
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  Blogs
                </p>
                <ul className="space-y-0.5">
                  {blogSources.map(({ source, count }) => {
                    const isActive = selectedChannel === source;
                    return (
                      <li key={source}>
                        <button
                          onClick={() => setSelectedChannel(isActive ? null : source)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          <span className="truncate text-left">{source}</span>
                          <span className={cn(
                            "ml-2 shrink-0 text-xs rounded-full px-1.5 py-0.5",
                            isActive ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                          )}>
                            {count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow min-w-0 px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <motion.div
                key={selectedChannel ?? "all"}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2"
              >
                <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
                  {selectedChannel ? selectedChannel.replace("▶ ", "") : "Software Testing with AI"}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {selectedChannel
                    ? `${filteredArticles.length} video${filteredArticles.length !== 1 ? "s" : ""} from this channel`
                    : "Latest videos and articles from top software testing YouTube channels and blogs — covering AI-powered testing, automation, and QA trends."}
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Button
                  variant="outline"
                  onClick={handleForceRefresh}
                  disabled={isRefetching || isLoading}
                  className="bg-card/50 backdrop-blur-sm"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                  Refresh Feed
                </Button>
              </motion.div>
            </div>

            {/* Mobile channel chips */}
            {!isLoading && !isError && sources.length > 0 && (
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
                <button
                  onClick={() => setSelectedChannel(null)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                    !selectedChannel
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground"
                  )}
                >
                  All
                </button>
                {sources.map(({ source }) => {
                  const label = source.replace("▶ ", "");
                  const isActive = selectedChannel === source;
                  return (
                    <button
                      key={source}
                      onClick={() => setSelectedChannel(isActive ? null : source)}
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                        isActive
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Fetching the latest intel...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-3xl border border-destructive/10">
                <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Failed to load news</h2>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  We couldn&apos;t reach the data sources. Please try again later.
                </p>
                <Button onClick={() => refetch()} variant="secondary">
                  Try Again
                </Button>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No articles found at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
                {filteredArticles.map((article, index) => (
                  <NewsCard key={article.id} article={article} index={index} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

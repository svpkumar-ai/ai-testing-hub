import { useGetNews, getGetNewsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import { NewsCard } from "@/components/news-card";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui-elements";
import { motion } from "framer-motion";

export default function HomePage() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetNews(
    { page: 1, limit: 50 },
    {
      query: {
        queryKey: getGetNewsQueryKey({ page: 1, limit: 50 }),
        staleTime: 1000 * 60 * 5,
      },
    }
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Software Testing with AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Latest videos and articles from top software testing YouTube channels and blogs — covering AI-powered testing, automation, and QA trends.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching || isLoading}
              className="bg-card/50 backdrop-blur-sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh Feed
            </Button>
          </motion.div>
        </div>

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
        ) : data?.articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              No articles found at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {data?.articles.map((article, index) => (
              <NewsCard key={article.id} article={article} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

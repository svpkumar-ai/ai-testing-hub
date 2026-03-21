import {
  NewsArticle,
  useSavePost,
  useGetSavedPosts,
  getGetSavedPostsQueryKey,
} from "@workspace/api-client-react";
import { Card, Button, cn } from "./ui-elements";
import { format, isValid } from "date-fns";
import { ExternalLink, BookmarkPlus, Check, Sparkles, Star, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { motion } from "framer-motion";

interface NewsCardProps {
  article: NewsArticle;
  index: number;
}

export function NewsCard({ article, index }: NewsCardProps) {
  const { user } = useAuth();
  const [isJustSaved, setIsJustSaved] = useState(false);

  const { data: savedData } = useGetSavedPosts({
    query: {
      queryKey: getGetSavedPostsQueryKey(),
      enabled: !!user && !user.isGuest,
      staleTime: 1000 * 60 * 5,
    },
  });

  const { mutate: save, isPending: isSaving } = useSavePost({
    mutation: {
      onSuccess: () => {
        setIsJustSaved(true);
      }
    }
  });

  const isAlreadySaved = savedData?.posts.some(p => p.articleUrl === article.url) || isJustSaved;
  const canSave = user && !user.isGuest && !isAlreadySaved;

  const handleSave = () => {
    if (!canSave) return;
    save({
      data: {
        articleUrl: article.url,
        articleTitle: article.title,
        articleSource: article.source,
        articleDate: article.publishedAt,
        articleDescription: article.description,
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className={cn(
        "group relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-card/80",
        article.starred ? "border-yellow-500/40 hover:border-yellow-500/70 shadow-yellow-500/5" :
        article.isRelevantToDevTesting ? "border-accent/30 hover:border-accent/60 shadow-accent/5" : "hover:border-primary/30"
      )}>
        {/* Glow effect on hover */}
        <div className={cn(
          "absolute -inset-px opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20",
          article.starred ? "bg-yellow-500" :
          article.isRelevantToDevTesting ? "bg-accent" : "bg-primary"
        )} />
        
        <div className="relative flex flex-col flex-grow p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-white/10">
                {article.source}
              </span>
              {article.isRelevantToDevTesting && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent border border-accent/20 shadow-[0_0_10px_rgba(20,200,120,0.2)]">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </span>
              )}
              {article.starred && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-bold text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  Top Viewed
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {(() => {
                try {
                  const d = new Date(article.publishedAt);
                  return isValid(d) ? format(d, "MMM d, yyyy") : "Recent";
                } catch {
                  return "Recent";
                }
              })()}
            </span>
          </div>

          <h3 className="font-display text-xl font-bold leading-tight text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
              <span className="absolute inset-0 z-10" />
              {article.title}
            </a>
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed flex-grow line-clamp-3 mb-6">
            {article.description}
          </p>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-20">
            <div className="flex flex-col gap-1">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-foreground transition-colors"
              >
                Read Full Article <ExternalLink className="ml-1 h-4 w-4" />
              </a>
              {article.starred && article.viewCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-yellow-400/80">
                  <Eye className="h-3 w-3" />
                  {article.viewCount.toLocaleString()} views
                </span>
              )}
            </div>

            {user && !user.isGuest && (
              <Button
                variant={isAlreadySaved ? "secondary" : "outline"}
                size="sm"
                className={cn("h-8 rounded-lg z-20", isAlreadySaved && "bg-white/10 text-white cursor-default hover:bg-white/10")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }}
                isLoading={isSaving}
                disabled={isAlreadySaved || isSaving}
              >
                {isAlreadySaved ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-accent" />
                    Saved
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

import { useGetSavedPosts, useRemoveSavedPost } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import { Card, Button } from "@/components/ui-elements";
import { Loader2, Trash2, ExternalLink, BookmarkX } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function SavedPostsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useGetSavedPosts();
  
  const { mutate: remove, isPending: isRemoving } = useRemoveSavedPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/saved-posts"] });
      }
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">Saved Posts</h1>
          <p className="text-lg text-muted-foreground mt-2">Your personal library of important AI updates and reference material.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-destructive">Failed to load saved posts.</div>
        ) : data?.posts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 bg-card/30 border border-white/5 rounded-3xl"
          >
            <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-inner shadow-black/50 border border-white/5">
              <BookmarkX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2">No saved posts yet</h2>
            <p className="text-muted-foreground text-center max-w-md">
              When you find an article on the feed that you want to keep, click the Save button and it will appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {data?.posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <Card className="flex flex-col sm:flex-row gap-6 p-6 items-start sm:items-center group hover:bg-card/80 transition-colors">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-muted-foreground border border-white/10">
                          {post.articleSource}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(post.articleDate), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground/50 ml-auto">
                          Saved {format(parseISO(post.savedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      
                      <h3 className="font-display text-xl font-bold leading-tight text-foreground mb-2 pr-4 truncate">
                        {post.articleTitle}
                      </h3>
                      
                      {post.articleDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-2 pr-4">
                          {post.articleDescription}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
                      <a 
                        href={post.articleUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium transition-all"
                      >
                        Read <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                      
                      <Button
                        variant="destructive"
                        className="flex-1 sm:flex-none h-10 px-4 group/btn"
                        onClick={() => remove({ id: post.id })}
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2 group-hover/btn:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

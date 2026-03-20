import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui-elements";
import { BookmarkIcon, LogOut, TerminalSquare } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <TerminalSquare className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-gradient">Testing Hub</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location === '/' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              Feed
            </Link>
            {!user.isGuest && (
              <Link 
                href="/saved-posts" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location === '/saved-posts' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
              >
                Saved Posts
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <div className={`h-2 w-2 rounded-full ${user.isGuest ? 'bg-muted-foreground' : 'bg-green-500'}`} />
            <span className="text-sm font-medium text-muted-foreground">
              {user.isGuest ? "Guest" : user.username}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => logout()} 
            isLoading={isLoggingOut}
            className="text-muted-foreground hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

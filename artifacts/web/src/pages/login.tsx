import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useGuestLogin } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button, Input } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { TerminalSquare, UserIcon, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { setToken } from "@/lib/token";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending: isLoggingIn } = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/");
      },
      onError: () => {
        setError("root", { message: "Invalid username or password" });
      }
    }
  });

  const { mutate: guestLogin, isPending: isGuestLoggingIn } = useGuestLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/");
      }
    }
  });

  if (authLoading || user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract Background" 
          className="w-full h-full object-cover opacity-60 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle top highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="text-center mb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-xl shadow-primary/20 mb-6">
              <TerminalSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your Testing Hub account</p>
          </div>

          <form onSubmit={handleSubmit((data) => login({ data }))} className="space-y-4 mb-6">
            <Input
              placeholder="Username"
              {...register("username")}
              error={errors.username?.message}
              autoComplete="username"
            />
            <Input
              type="password"
              placeholder="Password"
              {...register("password")}
              error={errors.password?.message}
              autoComplete="current-password"
            />
            
            {errors.root && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoggingIn}>
              Sign In
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#14151a] text-muted-foreground rounded-full border border-white/5">or continue as</span>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              type="button" 
              variant="secondary" 
              className="w-full group" 
              size="lg"
              onClick={() => guestLogin()}
              isLoading={isGuestLoggingIn}
            >
              <UserIcon className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              Guest Access
              <ArrowRight className="ml-auto h-5 w-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </Button>
            
            <div className="grid grid-cols-2 gap-4 text-center pt-4 border-t border-white/5 mt-4">
              <Link href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                Create Account
              </Link>
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium border-l border-white/10">
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

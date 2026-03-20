import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button, Input } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { setToken } from "@/lib/token";
import { TerminalSquare, ArrowLeft } from "lucide-react";

const registerSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9]+$/, "Username can only contain alphanumeric characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setError } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const { mutate: createAccount, isPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/");
      },
      onError: (error) => {
        const msg =
          (error.data as { error?: string } | null)?.error ??
          "Registration failed. Username might be taken.";
        setError("root", { message: msg });
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract Background" 
          className="w-full h-full object-cover opacity-50 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      </div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          <Link href="/login" className="absolute top-6 left-6 text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          <div className="text-center mb-8 mt-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20 mb-4">
              <TerminalSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-sm text-muted-foreground">Join the hub to save and manage posts.</p>
          </div>

          <form onSubmit={handleSubmit((data) => createAccount({ data }))} className="space-y-4">
            <Input
              placeholder="Username (Alphanumeric only)"
              {...register("username")}
              error={errors.username?.message}
            />
            <Input
              type="password"
              placeholder="Password"
              {...register("password")}
              error={errors.password?.message}
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
            
            {errors.root && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full mt-6" size="lg" isLoading={isPending}>
              Create Account
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

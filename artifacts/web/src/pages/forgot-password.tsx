import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResetPassword } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button, Input } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { TerminalSquare, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const resetSchema = z.object({
  username: z.string().min(1, "Username is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const { mutate: doReset, isPending } = useResetPassword({
    mutation: {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => setLocation("/login"), 3000);
      },
      onError: (error) => {
        const msg =
          (error.data as { error?: string } | null)?.error ??
          "User not found or reset failed.";
        setError("root", { message: msg });
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-background" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          {!success && (
            <Link href="/login" className="absolute top-6 left-6 text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          
          <div className="text-center mb-8 mt-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-muted shadow-lg shadow-black/20 border border-white/5 mb-4">
              {success ? <CheckCircle2 className="h-6 w-6 text-accent" /> : <TerminalSquare className="h-6 w-6 text-primary" />}
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              {success ? "Password Reset" : "Reset Password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {success ? "Your password has been updated. Redirecting..." : "Enter your username and a new strong password."}
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit((data) => doReset({ data }))} className="space-y-4">
              <Input
                placeholder="Username"
                {...register("username")}
                error={errors.username?.message}
              />
              <Input
                type="password"
                placeholder="New Password"
                {...register("newPassword")}
                error={errors.newPassword?.message}
              />
              <Input
                type="password"
                placeholder="Confirm New Password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />
              
              {errors.root && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center">
                  {errors.root.message}
                </div>
              )}

              <Button type="submit" className="w-full mt-6" size="lg" isLoading={isPending}>
                Reset Password
              </Button>
            </form>
          ) : (
            <Button className="w-full" size="lg" onClick={() => setLocation("/login")}>
              Return to Login
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

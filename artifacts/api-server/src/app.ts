import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import router from "./routes";

const app: Express = express();

const isProd = process.env.NODE_ENV === "production";

function buildAllowedOrigins(): string[] | null {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  }
  if (process.env.REPLIT_DOMAINS) {
    return process.env.REPLIT_DOMAINS.split(",").map(
      (d) => `https://${d.trim()}`
    );
  }
  return null;
}

const allowedOrigins = isProd ? buildAllowedOrigins() : null;

app.use(
  cors({
    origin:
      isProd && allowedOrigins
        ? (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
          }
        : true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export const JWT_SECRET =
  process.env.JWT_SECRET ??
  process.env.SESSION_SECRET ??
  "ai-news-hub-dev-jwt-secret-not-for-production";

if (isProd && JWT_SECRET === "ai-news-hub-dev-jwt-secret-not-for-production") {
  throw new Error(
    "JWT_SECRET (or SESSION_SECRET) environment variable must be set in production"
  );
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        username: string;
        isGuest: boolean;
      };
      req.user = payload;
    } catch {
      // invalid token — req.user stays undefined
    }
  }
  next();
});

app.use("/api", router);

export default app;

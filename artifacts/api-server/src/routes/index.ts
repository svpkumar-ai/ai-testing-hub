import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import newsRouter from "./news";
import savedPostsRouter from "./saved-posts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(newsRouter);
router.use(savedPostsRouter);

export default router;

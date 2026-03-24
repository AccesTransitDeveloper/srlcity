import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import postsRouter from "./posts";
import groupsRouter from "./groups";
import eventsRouter from "./events";
import messagesRouter from "./messages";
import notificationsRouter from "./notifications";
import uploadRouter from "./upload";
import ridesRouter from "./rides";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(postsRouter);
router.use(groupsRouter);
router.use(eventsRouter);
router.use(messagesRouter);
router.use(notificationsRouter);
router.use(uploadRouter);
router.use(ridesRouter);

export default router;

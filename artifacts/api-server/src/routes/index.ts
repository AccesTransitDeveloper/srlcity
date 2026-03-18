import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import postsRouter from "./posts";
import groupsRouter from "./groups";
import eventsRouter from "./events";
import messagesRouter from "./messages";
import notificationsRouter from "./notifications";
import seedRouter from "./seed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(postsRouter);
router.use(groupsRouter);
router.use(eventsRouter);
router.use(messagesRouter);
router.use(notificationsRouter);
router.use(seedRouter);

export default router;

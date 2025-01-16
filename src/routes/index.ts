import { Router } from "express";
import signupRouter from "./routers/SignupRouter";
import preferencesRouter from "./routers/PreferencesRouter";
import videoRouter from "./routers/VideoRouter";
import profileRouter from "./routers/ProfileRouter";
import imageRouter from "./routers/ImageRouter";
import mediaRouter from "./routers/MediaRouter";
import postRouter from "./routers/PostRouter";
import projectRouter from "./routers/ProjectRouter";
import workRouter from "./routers/WorkRouter";
import tagsRouter from "./routers/TagsRouter";
import threedRouter from "./routers/3dRouter";
import generalRouter from "./routers/GeneralRouter";

//New Router instance
const router = Router();

// /api/

// page paths
router.use("/works", workRouter);
router.use("/projects", projectRouter);
router.use("/posts", postRouter);

// custom paths
router.use("/preferences", preferencesRouter);
router.use("/signup", signupRouter);
router.use("/profile", profileRouter);
router.use("/videos", videoRouter);
router.use("/images", imageRouter);
router.use("/media", mediaRouter);
router.use("/tags", tagsRouter);
router.use("/models", threedRouter);

//
router.use("/general", generalRouter);
export default router;

import { Router } from "express";
import { VideoController } from "../../../controllers/VideoController";

const videoController = new VideoController();
const videoRouter = Router();

videoRouter.get("/", videoController.get);
videoRouter.post("/update/:etag", videoController.updateMedia);
videoRouter.post("/update", videoController.upsertMedia);
videoRouter.post("/delete", videoController.deleteManyMedia);

export default videoRouter;

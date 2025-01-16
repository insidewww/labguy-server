import GeneralController from "../../controllers/GeneralController";
import { createDeafultRouter } from "../../utils/createDefaultRouter";

const generalController = new GeneralController();
const generalRouter = createDeafultRouter(generalController);

export default generalRouter;

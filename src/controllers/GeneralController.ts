import expressAsyncHandler from "express-async-handler";
import { Controller } from "./Controller";
import { successResponse } from "../utils/responses";
import { prisma } from "../prismaclient";

export default class GeneralController extends Controller {
  constructor() {
    super("generalSection");
  }
  get = expressAsyncHandler(async (req, res) => {
    const records = await prisma.generalSection.findMany({
      include: {
        post: {
          select: {
            id: true,
          },
        },
        project: {
          select: {
            id: true,
          },
        },
        work: {
          select: {
            id: true,
          },
        },
      },
    });
    successResponse(res, records);
  });
}

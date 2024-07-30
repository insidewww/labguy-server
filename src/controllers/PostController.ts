import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Controller } from "./Controller";
import { generateSlug } from "../utils/generateSlug";
import { successResponse } from "../utils/responses";
import { prisma } from "../client";

export class PostController extends Controller {
  constructor() {
    super("post");
  }

  get = asyncHandler(async (req: Request, res: Response) => {
    const posts = await prisma.post.findMany({
      include: {
        general: true,
      },
    });
    successResponse(res, posts);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const createdRecord = await prisma.post.create({
      data: {
        ...req.body,
        general: {
          create: {
            ...req.body.general,
            slug: generateSlug(req.body.general.title, prisma.post),
          },
        },
      },
    });
    successResponse(res, createdRecord);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const postId: number = parseInt(req.params.id, 10);
    const updatedRecord = await prisma.post.update({
      where: { id: postId },
      data: { ...req.body, general: { update: req.body.general } },
      include: {
        general: true,
      },
    });
    successResponse(res, updatedRecord);
  });
}

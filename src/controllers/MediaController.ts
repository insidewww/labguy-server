import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { prisma } from "../prismaclient";
import { successResponse } from "../utils/responses";
import { VideoRef } from "@prisma/client";

export class MediaController {
  delegate: any;

  constructor(model?: "imageRef" | "videoRef" | "threedRef") {
    this.delegate = model && prisma[model];
  }

  get = asyncHandler(async (req: Request, res: Response) => {
    // Fetch all images
    const images = await prisma.imageRef.findMany({});

    // Fetch all videos
    const videos = await prisma.videoRef.findMany({});

    //Fetch all 3d models
    const threed = await prisma.threedRef.findMany({
      include: { poster: true },
    });

    // Combine the results
    const media = [...images, ...videos, ...threed];

    // Sort combined results by createdAt. It's slow but good enough for now.
    media.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Send successful response
    res.json(media);
  });

  update = asyncHandler(async (req, res) => {
    const etag: string = req.params.etag;
    const updatedImg = req.body;

    const updated = await this.delegate.update({
      where: { etag: etag },
      data: updatedImg,
    });
    successResponse(res, updated);
  });

  upsert = asyncHandler(async (req, res) => {
    const mediaRef = await this.delegate.upsert({
      where: {
        etag: req.body.etag,
      },
      create: req.body,
      update: req.body,
    });
    successResponse(res, mediaRef);
  });

  deleteManyMedia = asyncHandler(async (req: Request, res: Response) => {
    const etags: string[] = req.body.map((media: VideoRef) => media.etag);

    if (!Array.isArray(etags) || etags.length === 0) {
      res.status(400).json({
        message: 'Invalid request: "etags" must be a non-empty array.',
      });
    }

    const deleted = await this.delegate.deleteMany({
      where: { etag: { in: etags } },
    });

    successResponse(res, deleted);
  });
}

import expressAsyncHandler from "express-async-handler";
import { MediaController } from "./MediaController";
import { badRequestResponse, successResponse } from "../utils/responses";
import { Request, Response } from "express";
import { prisma } from "../prismaclient";
import { env } from "process";
import { Vimeo } from "vimeo";

async function fetchData(endpoint: string) {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch video data: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items) {
      throw new Error("No data available for this video ID");
    }

    return data.items[0];
  } catch (error) {
    throw error;
  }
}

async function getVideoData(req: Request, res: Response): Promise<any> {
  const getVideoId = (await import("get-video-id")).default;
  const { youtube_url, soundcloud_url, vimeo_url } = req.body;

  let videoData;

  switch (true) {
    case !!youtube_url: {
      const yt_api_key = env.YT_API_KEY;
      if (!yt_api_key) throw new Error("no yt api key found");

      const { id: video_id } = getVideoId(youtube_url);
      const ytEndpoint = `https://www.googleapis.com/youtube/v3/videos?&key=${yt_api_key}&part=snippet,contentDetails&id=${video_id}`;

      if (!video_id) {
        badRequestResponse(res, "Invalid YouTube URL");
        return;
      }

      videoData = await fetchData(ytEndpoint);
      break;
    }
    case !!vimeo_url: {
      if (!env.VIMEO_ID || !env.VIMEO_SECRET || !env.VIMEO_TOKEN) {
        throw new Error(
          `Missing Vimeo configuration: 
          VIMEO_ID=${env.VIMEO_ID || "undefined"},
          VIMEO_SECRET=${env.VIMEO_SECRET || "undefined"},
          VIMEO_TOKEN=${env.VIMEO_TOKEN || "undefined"}`
        );
      }

      let client = new Vimeo(env.VIMEO_ID, env.VIMEO_SECRET, env.VIMEO_TOKEN);
      const { id: video_id } = getVideoId(vimeo_url);

      // Use a Promise to handle Vimeo's async request
      videoData = await new Promise((resolve, reject) => {
        client.request(
          {
            method: "GET",
            path: `/videos/${video_id}`,
          },
          (error: any, body: any, status_code: any, headers: any) => {
            if (error) {
              reject(
                new Error(`Failed to fetch Vimeo video data: ${error.message}`)
              );
              return;
            }
            // Extract relevant video data
            const videoData = {
              etag: video_id,
              title: body.name,
              vimeo_url: vimeo_url,
              description: body.description,
              duration: `PT0M${String(body.duration)}S`,
              thumbnail: body.pictures.sizes[3].link,
              definition: `${body.width}px x ${body.height}px`,
            };
            return resolve(videoData);
          }
        );
      });
      break;
    }
    case !!soundcloud_url: {
      throw new Error("SoundCloud data fetching not implemented");
    }
    default:
      badRequestResponse(res, "No valid URL provided");
      return;
  }
  return videoData;
}

export class VideoController extends MediaController {
  constructor() {
    super("videoRef");
  }
  get = expressAsyncHandler(async (req, res) => {
    const videoArray = await prisma.videoRef.findMany();

    successResponse(res, videoArray);
  });

  upsert = expressAsyncHandler(async (req: Request, res: Response) => {
    const { youtube_url, soundcloud_url, vimeo_url } = req.body;
    const videoData = await getVideoData(req, res);

    let reference;

    if (youtube_url) {
      reference = {
        etag: videoData.etag,
        public_id: videoData.id,
        yt_url: req.body.youtube_url,
        vimeo_url: videoData.vimeo_url,
        title: videoData.snippet.title,
        description: videoData.snippet.description,
        thumbnail: videoData.snippet.thumbnails.high.url,
        duration: videoData.contentDetails.duration,
        definition: videoData.contentDetails.definition,
      };
    } else if (vimeo_url) {
      reference = videoData;
    }

    const mediaRef = await prisma.videoRef.upsert({
      where: { etag: reference.etag },
      update: reference,
      create: reference,
    });

    successResponse(res, mediaRef);
  });
}

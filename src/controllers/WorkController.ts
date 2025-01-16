import { ProjectsOnWorksController } from "./ProjectsOnWorksController";
import expressAsyncHandler from "express-async-handler";
import { notFoundResponse, successResponse } from "../utils/responses";
import { prisma } from "../prismaclient";
import { getAllmedia, parseId } from "../utils/helpers";
import { ImageRef, ThreedRef, VideoRef } from "@prisma/client";

export class WorkController extends ProjectsOnWorksController {
  constructor() {
    super("work");
  }

  getUnique = expressAsyncHandler(async (req, res) => {
    // there might be multiple works with the same title (variants)
    // this should respond with non-duplicates, latest works

    const items = await prisma.work.findMany({
      include: {
        general: { include: { tags: true } },
      },
      orderBy: {
        year: "desc",
      },
    });

    //for now use javascript, could be changed in the future if prisma implement nested relations grouping https://github.com/prisma/prisma/issues/8744
    const uniqueItems = Object.values(
      items.reduce<{ [key: string]: (typeof items)[0] }>((acc, item) => {
        const title = item.general?.title;

        // Determine the date to use for comparison (prefer updatedAt, fallback to createdAt)
        const compareDate = item.general.updatedAt || item.general.createdAt;

        // Keep only the work with the latest updatedAt (or createdAt if updatedAt is missing) for each title
        if (
          !acc[title] ||
          new Date(
            acc[title].general.updatedAt || acc[title].general.createdAt
          ) < new Date(compareDate)
        ) {
          acc[title] = item;
        }

        return acc;
      }, {})
    );

    // Respond with the processed unique works
    successResponse(res, uniqueItems);
  });

  getOne = expressAsyncHandler(async (req, res) => {
    const parsedId = parseId(req.params.id);

    let record;

    if (typeof parsedId === "string") {
      // If the ID is a string, look up the generalSection by slug
      const generalRecord = await prisma.generalSection.findUnique({
        where: { slug: parsedId },
      });

      if (!generalRecord) return notFoundResponse(res, "Record not found");

      // Now find the work by the generalId
      record = await prisma.work.findUnique({
        where: { generalId: generalRecord.id },
        include: {
          general: {
            include: {
              tags: true,
            },
          },
          ProjectsOnWorks: {
            include: {
              project: { include: { general: true } },
            },
          },
        },
      });
    } else {
      // If the ID is a number, look up the work directly by id
      record = await prisma.work.findUnique({
        where: { id: parsedId },
        include: {
          general: {
            include: {
              tags: true,
            },
          },
          ProjectsOnWorks: {
            include: {
              project: { include: { general: true } },
            },
          },
        },
      });
    }

    // Post-process
    if (record) {
      // map projects from ProjectsOnWorks
      const projects = record.ProjectsOnWorks.map((p) => p.project); // Extract the project objects

      // get ordered media
      const mediaOrdered = Array.isArray(record.media)
        ? (
            record.media as ({ etag: string; mediaType: string } | null)[]
          ).filter((media) => media && media.etag && media.mediaType)
        : [];

      const media = await getAllmedia(
        mediaOrdered as { etag: string; mediaType: string }[]
      );

      // Add up-to-date fields to the response
      const response = {
        ...record,
        projects,
        media,
      };

      successResponse(res, response);
    } else {
      return notFoundResponse(res, "Record not found");
    }
  });

  update = expressAsyncHandler(async (req, res) => {
    const workId: number = parseInt(req.params.id, 10);
    const updateData = await this.updateData(req);
    const projects = req.body.projects;
    const count = (await prisma.projectsOnWorks.count()).toString();
    const { dimensions, year, medium, description, urls } = req.body;

    // Get the project IDs from the request body
    const projectIds = projects.map((project: { id: number }) => project.id);

    // Prepare the new project connections with `fIndex`
    const projectConnections = projects.map((project: { id: number }) => ({
      projectId: project.id,
      workId: workId,
      fIndex: count, // Assuming fIndex is calculated elsewhere; if dynamic, adjust accordingly
    }));

    // Make sure to remove ID fields to avoid updating primary keys
    delete req.body.id;
    delete req.body.generalId;
    delete req.body.projects;

    // Add missing props
    const newData = {
      description,
      dimensions,
      year,
      medium,
      ...updateData,
      media: req.body.media,
      urls,
    };

    // Update the work entry
    const updatedRecord = await prisma.work.update({
      where: { id: workId }, // Specify the Work ID to update
      data: newData,
      include: {
        general: { include: { tags: true } },
      },
    });

    // Remove relations that are not in the provided projects array
    await prisma.projectsOnWorks.deleteMany({
      where: {
        workId: workId,
        projectId: {
          notIn: projectIds, // Remove old relations that are not in the new project array
        },
      },
    });

    // Upsert new relations into the ProjectsOnWorks table
    await Promise.all(
      projectConnections.map(
        async (connection: { projectId: any; workId: any; fIndex: any }) => {
          await prisma.projectsOnWorks.upsert({
            where: {
              projectId_workId: {
                projectId: connection.projectId,
                workId: connection.workId,
              }, // Use compound unique constraint
            },
            update: {
              fIndex: connection.fIndex, // If the relation already exists, update `fIndex`
            },
            create: connection, // If it doesn't exist, create a new relation
          });
        }
      )
    );

    // Return a success response
    successResponse(res, updatedRecord);
  });
}

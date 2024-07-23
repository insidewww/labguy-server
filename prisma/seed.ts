import { PrismaClient, MediaType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Upsert GeneralSection
  const generalSection = await prisma.generalSection.upsert({
    where: { slug: "general-slug-1" },
    update: {
      title: "General Section 1",
      description: "Description of General Section 1",
      published: true,
      tags: ["tag1", "tag2"],
    },
    create: {
      slug: "general-slug-1",
      title: "General Section 1",
      description: "Description of General Section 1",
      published: true,
      tags: ["tag1", "tag2"],
    },
  });

  // Upsert ImageRefs
  const imageRef1 = await prisma.imageRef.upsert({
    where: { etag: "etag-image-1" },
    update: {
      type: MediaType.IMAGE,
      general: {
        connect: { slug: generalSection.slug },
      },
      cld_url: "https://example.com/image1.jpg",
      filename: "image1.jpg",
      format: "jpg",
      bytes: 123456,
    },
    create: {
      etag: "etag-image-1",
      type: MediaType.IMAGE,
      general: {
        connect: { slug: generalSection.slug },
      },
      cld_url: "https://example.com/image1.jpg",
      filename: "image1.jpg",
      format: "jpg",
      bytes: 123456,
    },
  });

  const imageRef2 = await prisma.imageRef.upsert({
    where: { etag: "etag-image-2" },
    update: {
      type: MediaType.IMAGE,
      general: {
        connect: { slug: generalSection.slug },
      },
      cld_url: "https://example.com/image2.jpg",
      filename: "image2.jpg",
      format: "png",
      bytes: 654321,
    },
    create: {
      etag: "etag-image-2",
      type: MediaType.IMAGE,
      general: {
        connect: { slug: generalSection.slug },
      },
      cld_url: "https://example.com/image2.jpg",
      filename: "image2.jpg",
      format: "png",
      bytes: 654321,
    },
  });

  // Upsert VideoRefs
  const videoRef1 = await prisma.videoRef.upsert({
    where: { etag: "etag-video-1" },
    update: {
      type: MediaType.VIDEO,
      general: {
        connect: { slug: generalSection.slug },
      },
      yt_url: "https://youtube.com/video1",
    },
    create: {
      etag: "etag-video-1",
      type: MediaType.VIDEO,
      general: {
        connect: { slug: generalSection.slug },
      },
      yt_url: "https://youtube.com/video1",
    },
  });

  const videoRef2 = await prisma.videoRef.upsert({
    where: { etag: "etag-video-2" },
    update: {
      type: MediaType.VIDEO,
      general: {
        connect: { slug: generalSection.slug },
      },
      yt_url: "https://youtube.com/video2",
    },
    create: {
      etag: "etag-video-2",
      type: MediaType.VIDEO,
      general: {
        connect: { slug: generalSection.slug },
      },
      yt_url: "https://youtube.com/video2",
    },
  });

  // Upsert User
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {
      email: "user@example.com",
      profile: {
        update: {
          statement_html: "<p>Profile statement</p>",
          additional_html: ["<p>Additional info</p>"],
          portfolio_pdf: "https://example.com/portfolio.pdf",
        },
      },
    },
    create: {
      email: "user@example.com",
      profile: {
        create: {
          statement_html: "<p>Profile statement</p>",
          additional_html: ["<p>Additional info</p>"],
          portfolio_pdf: "https://example.com/portfolio.pdf",
        },
      },
    },
  });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

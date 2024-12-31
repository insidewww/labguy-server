import sharp from "sharp";
import path from "path";
import fs from "fs";
import sanitizeFilename from "./sanitizeFilename";
import isImageBright from "./isImageBright";
import { publicUploadDir } from "./helpers";

const imageUploadDir = path.join(publicUploadDir, "images");

if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}

export async function saveSharpImage(
  file: Express.Multer.File
): Promise<{ path: string; filename: string; isBright: boolean }> {
  const sanitized = sanitizeFilename(file.originalname);
  const originalExtension = path.extname(file.originalname).toLowerCase();
  const filename = `${sanitized.name}${originalExtension}`;
  const filePath = path.join(imageUploadDir, filename);

  const image = sharp(file.buffer);
  const metadata = await image.metadata();
  const maxLength = 3840;

  // Check if resizing is needed
  if (
    metadata.width &&
    metadata.height &&
    (metadata.width > maxLength || metadata.height > maxLength)
  ) {
    const resizeOptions =
      metadata.width > metadata.height
        ? { width: maxLength }
        : { height: maxLength };

    await image.resize(resizeOptions);
  }

  // Save the image in the correct format based on the original file extension
  const format = metadata.format || "jpg";

  await image.toFormat(format, { quality: 80 }).toFile(filePath);

  // Check if the image is bright
  const isBright = await isImageBright(file.buffer);

  return {
    path: filePath,
    filename: filename,
    isBright: isBright,
  };
}

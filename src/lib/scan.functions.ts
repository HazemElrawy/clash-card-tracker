import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  imageDataUrl: z.string().min(32).max(12_000_000),
  userApiKey: z.string().optional(),
});

export const scanScreenshot = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { readScreenshot } = await import("./scan.server");
    return readScreenshot(data.imageDataUrl, data.userApiKey);
  });

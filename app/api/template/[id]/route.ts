import { db } from "@/lib/db";
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "Missing playground ID" }, { status: 400 });
  }

  const playground = await db.playground.findUnique({
    where: { id },
  });

  if (!playground) {
    return Response.json({ error: "Playground not found" }, { status: 404 });
  }

  const templateKey = playground.template;
  const filePath = path.join(process.cwd(), `prebuilt-templates/${templateKey}.json`);

  try {
    const data = await fs.readFile(filePath, "utf8");
    const result = JSON.parse(data);

    return Response.json(
      { success: true, templateJson: result },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error loading template JSON:", error);
    return Response.json(
      { error: "Failed to load template" },
      { status: 500 },
    );
  }
}
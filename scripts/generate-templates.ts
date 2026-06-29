import { saveTemplateStructureToJson } from "@/modules/playground/lib/path-to-json";
import path from "path";
import fs from "fs/promises";

const templatePaths = {
  REACT: "vibecode-starters/react-ts",
  NEXTJS: "vibecode-starters/nextjs",
  EXPRESS: "vibecode-starters/express-simple",
  VUE: "vibecode-starters/vue",
  HONO: "vibecode-starters/hono-nodejs-starter",
  ANGULAR: "vibecode-starters/angular",
};

async function main() {
  await fs.mkdir(path.join(process.cwd(), "prebuilt-templates"), { recursive: true });

  for (const [key, relPath] of Object.entries(templatePaths)) {
    const inputPath = path.join(process.cwd(), relPath);
    const outputPath = path.join(process.cwd(), `prebuilt-templates/${key}.json`);
    console.log(`Generating ${key}...`);
    await saveTemplateStructureToJson(inputPath, outputPath);
  }
  console.log("Done.");
}

main();
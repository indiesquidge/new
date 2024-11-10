import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import fs from "fs/promises";
import path from "path";

import { parseWorkouts } from "~/workout-parser";

export const loader: LoaderFunction = async () => {
  const dataDir = path.join(process.cwd(), "app", "workout_data");
  try {
    const fileNames = await fs.readdir(dataDir);

    const workoutData = await fileNames.reduce(async (accPromise, fileName) => {
      const acc = await accPromise;
      const filePath = path.join(dataDir, fileName);
      const fileContent = await fs.readFile(filePath, "utf8");
      const parsedData = parseWorkouts(fileContent);

      return { ...acc, ...parsedData };
    }, Promise.resolve({}));

    return json(workoutData);
  } catch (error) {
    console.error("Error reading or parsing workout files:", error);
    throw new Response("Error fetching workout data", { status: 500 });
  }
};

import type { LoaderFunction } from "@remix-run/node";
import fs from "fs/promises";
import path from "path";

import { parseWorkouts } from "~/workout-parser";

export const loader: LoaderFunction = async ({ request }) => {
  const dataDir = path.join(process.cwd(), "app", "workout_data");
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get("year");
    const currentYear = new Date().getFullYear().toString();
    const month = url.searchParams.get("month");
    const fileNames = await fs.readdir(dataDir);

    // Parse workout data from files and merge into one object
    const workoutData = await fileNames.reduce(async (accPromise, fileName) => {
      const acc = await accPromise;
      const filePath = path.join(dataDir, fileName);
      const fileContent = await fs.readFile(filePath, "utf8");
      const parsedData = parseWorkouts(fileContent);

      return { ...acc, ...parsedData };
    }, Promise.resolve({}));

    // Filter data based on year and month query parameters
    let filteredData = workoutData;

    if (year) {
      filteredData = Object.keys(filteredData)
        .filter((date) => date.startsWith(year))
        .reduce(
          (acc, date) => {
            acc[date] = filteredData[date];
            return acc;
          },
          {} as typeof workoutData,
        );
    }

    if (month) {
      const formattedMonth = month.padStart(2, "0"); // Ensure month is two digits

      filteredData = Object.keys(filteredData)
        .filter((date) =>
          date.startsWith(`${year ?? currentYear}-${formattedMonth}`),
        )
        .reduce<typeof workoutData>((acc, date) => {
          acc[date] = filteredData[date];
          return acc;
        }, {});
    }

    return Response.json(filteredData);
  } catch (error) {
    console.error("Error reading or parsing workout files:", error);
    throw new Response("Error fetching workout data", { status: 500 });
  }
};

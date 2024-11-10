export const parseWorkouts = (rawText) => {
  const days = rawText.split(/\n(?=\d+-\d+-\d+)/);
  return days.reduce((acc, day) => {
    const date = day.substring(0, day.indexOf("\n")).trim();

    // Convert date from "M-D-YYYY" to "YYYY-MM-DD"
    const [month, dayPart, year] = date
      .split("-")
      .map((part) => part.padStart(2, "0"));
    const convertedDate = `${year}-${month}-${dayPart}`;

    acc[convertedDate] = parseDay(day);
    return acc;
  }, {});
};

const parseDay = (dayText) => {
  // First, split the day text into lines
  const lines = dayText.split("\n").map((line) => line.trim());

  // First line is the date, the rest of the lines are exercises
  const exerciseLines = lines.slice(1);

  // Replace single line breaks within each exercise block with a unique delimiter (e.g., "||")
  const formattedExerciseText = exerciseLines
    .join("\n")
    .replace(/\n(?![A-Z])/g, "||");

  // Now split the text on double line breaks, which separate different exercises
  const exercises = formattedExerciseText.split("||\n");

  return exercises.reduce((acc, exerciseText) => {
    // Replace the delimiter back with a line break
    exerciseText = exerciseText.replace(/\|\|/g, "\n");

    const exerciseDetails = exerciseText.split("\n").map((line) => line.trim());
    const [exerciseName, exerciseNote] = exerciseDetails[0].split(" (");
    const details = exerciseDetails.slice(1).join("\n");

    acc[exerciseName] = parseExercise(exerciseName, details);
    acc[exerciseName].note = exerciseNote ? exerciseNote.slice(0, -1) : null;
    return acc;
  }, {});
};

const parseExercise = (exerciseName, exerciseText) => {
  switch (exerciseName) {
    case "VO2 max intervals":
      return parseVO2MaxIntervals(exerciseText);
    case "Zone 2":
      return parseZone2Workout(exerciseText);
    case "Swimming":
      return parseSwimming(exerciseText);
    default:
      return parseStrengthExercise(exerciseText);
  }
};

const parseVO2MaxIntervals = (text) => {
  const lines = text.split("\n").map((line) => line.trim());
  const [machineType, durationInfo] = lines[0]
    .split("|")
    .map((info) => info.trim());
  const intervalPattern = /(\d+)x(\d+)/;
  const [highIntensityMatch, restMatch] = durationInfo.match(intervalPattern);
  const highIntensityDuration = parseInt(highIntensityMatch);
  const restDuration = parseInt(restMatch);

  const parseIntervalDetail = (detail) => {
    if (detail.includes("mph at")) {
      const [speed, incline] = detail
        .split("mph at ")
        .map((num) => parseFloat(num));
      return { speed, incline };
    } else if (detail.includes("level")) {
      const level = parseInt(detail.split("level ")[1]);
      return { level };
    }
  };

  const intervals = [];

  lines.slice(1).forEach((line) => {
    if (line.startsWith("Interval:")) {
      const intervalDetails = line.split("Interval: ")[1].split(", ");
      const highIntensityDetail = parseIntervalDetail(intervalDetails[0]);
      const restDetail = parseIntervalDetail(intervalDetails[1]);

      intervals.push({
        ...highIntensityDetail,
        duration: highIntensityDuration,
      });
      intervals.push({ ...restDetail, duration: restDuration });
    }
  });

  return {
    [machineType]: {
      duration: parseInt(durationInfo),
      intervals: intervals,
    },
  };
};

const parseZone2Workout = (text) => {
  const lines = text.split("\n").map((line) => line.trim());
  const [machineType, durationStr] = lines[0]
    .split("|")
    .map((info) => info.trim());
  const duration = parseInt(durationStr);

  const workoutDetails = {};

  lines.slice(1).forEach((line) => {
    if (line.includes("Avg watts")) {
      workoutDetails.avgWatts = parseInt(line.split(" ")[2]);
    } else if (line.includes("flights")) {
      workoutDetails.flights = parseInt(line.split(" ")[0]);
    } else if (line.includes("mph at") && line.includes("% grade")) {
      const [pace, grade] = line.split(" at ");
      const [incline] = grade.split("%");
      workoutDetails.pace = parseFloat(pace.trim());
      workoutDetails.incline = parseFloat(incline.trim());
    } else if (line.includes("Avg HR")) {
      workoutDetails.avgHR = parseInt(line.split(" ")[2]);
    }
  });

  return {
    [machineType]: {
      duration: duration,
      ...workoutDetails,
    },
  };
};

const parseSwimming = (text) => {
  const lines = text.split("\n").map((line) => line.trim());
  const duration = parseInt(lines[0].split(" ")[0]); // Assumes the first line is always the duration

  const sets = lines
    .slice(1)
    .filter((line) => line.includes("yds"))
    .map((line) => {
      const [, repeatCount, distance, restCount] = line.match(
        /(\d+)x(\d+) yds \((\d+) breaths rest\)/,
      );
      return {
        distance: parseInt(distance),
        count: parseInt(repeatCount),
        unit: "yds",
        rest: restCount + " breaths",
      };
    });

  const avgHRLine = lines.find((line) => line.includes("Avg HR"));
  const avgHR = avgHRLine ? parseInt(avgHRLine.split(" ")[2]) : undefined;

  return {
    duration: duration,
    sets: sets,
    avgHR: avgHR,
  };
};

const parseStrengthExercise = (exerciseText) => {
  const sets = exerciseText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const exerciseDetails = {
    note: null,
    sets: sets.map((set) => {
      const [weightReps, ...notes] = set
        .split("(")
        .map((part) => part.trim().replace(/\)$/, ""));
      const [weight, reps] = weightReps
        .split("x")
        .map((num) => parseInt(num.trim()));
      return {
        weight,
        reps,
        note: notes.length > 0 ? (notes.length > 1 ? notes : notes[0]) : null,
      };
    }),
  };

  return exerciseDetails;
};

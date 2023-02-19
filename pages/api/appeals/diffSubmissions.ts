import { exec } from "child_process";
import { existsSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * Data returned by the `diffSubmissions` API, which compares two assignment submissions.
 */
export type DiffSubmissionsData = {
  /** Diff output between the old submission and the new submission. */
  diff: string;
  /** Error message if any. */
  error: string | null;
};

/**
 * Compares two assignment submissions by running `git diff` on them.
 *
 * It requires `git` to be installed at the Next.js server.
 */
function diffSubmissions(req: NextApiRequest, res: NextApiResponse<DiffSubmissionsData>) {
  return new Promise<void>((resolve) => {
    const { oldId, newId } = req.query;

    if (
      (typeof oldId !== "string" && typeof oldId !== "number") ||
      (typeof newId !== "string" && typeof newId !== "number")
    ) {
      res.status(400).send({ diff: "", error: "Invalid submission IDs." });
      resolve();
    }

    const extractedDir = `${process.env.NEXT_PUBLIC_UPLOAD_DIR}/extracted`;
    const oldSubmissionPath = `${extractedDir}/${oldId}`;
    const newSubmissionPath = `${extractedDir}/${newId}`;
    const diffCommand = `git diff -a --diff-algorithm=minimal --no-index --no-color ${oldSubmissionPath} ${newSubmissionPath}`;

    if (!existsSync(oldSubmissionPath)) {
      res.status(404).send({ diff: "", error: `Failed to retrieve the old submission of ID #${oldId}.` });
      resolve();
    }
    if (!existsSync(newSubmissionPath)) {
      res.status(404).send({ diff: "", error: `Failed to retrieve the new submission of ID #${newId}.` });
      resolve();
    }

    exec(diffCommand, (error, stdout) => {
      // We check for `error.code !== 1` because `git diff` returns exit code 1 if there are differences.
      if (error && error.code !== 1) {
        res.status(500).send({ diff: "", error: JSON.stringify(error) });
        resolve();
      }

      // We remove the parent directory paths in the output because the users do not need to know where the
      // grader daemon stores the submissions.
      const diffOutput = stdout.replace(new RegExp(`(${oldSubmissionPath}|${newSubmissionPath})`, "g"), "");
      res.status(200).send({ diff: diffOutput, error: null });
      resolve();
    });
  });
}

export default diffSubmissions;

import { copyFile, statSync, readFileSync } from "fs";
import formidable from "formidable-serverless";
import AdmZip from "adm-zip";
import { parse } from "cookie";
import axios from "axios";
import sha256File from "sha256-file";
import { NextApiRequest, NextApiResponse } from "next";

interface Submission {
  stored_name: string;
  upload_name: string;
  extracted_path?: string;
  checksum: string;
  fail_reason?: string;
  remarks?: string[];
  size: number;
  assignment_config_id: number;
  user_id: number;
}

/** Success payload returned by the `addSubmissionEntry` GraphQL mutation. */
interface CreateSubmission {
  id: number;
  assignment_config_id: number;
  created_at: string;
  stored_name: string;
  upload_name: string;
  user_id: number;
}

async function submit(cookie: string, submission: Submission) {
  try {
    console.log(`in submission, cookie is ${cookie}`);
    const {
      data: { data, errors },
    } = await axios({
      method: "post",
      headers: {
        "X-Hasura-Admin-Secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET,
      },
      url: `http://${process.env.API_URL}/v1/graphql`,
      data: {
        query: `
          mutation addSubmissionEntry($submission: submissions_insert_input!) {
            createSubmission(object: $submission) {
              id
              assignment_config_id
              created_at
              stored_name
              upload_name
              user_id
            }
          }
        `,
        variables: { submission },
      },
    });
    if (!errors) {
      return data.createSubmission as CreateSubmission;
    } else {
      throw new Error(errors[0].message);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Decompresses and pushes a grading job in Redis.
 *
 * @param submission Data of the new submission.
 */
async function decompress(submission: CreateSubmission) {
  try {
    const { data } = await axios({
      method: "post",
      url: `http://${process.env.WEBHOOK_ADDR}/decompression`,
      data: {
        submission,
      },
    });
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    throw error;
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!req.headers.cookie) {
      res.status(400).json({
        status: "error",
        error: "No cookie is found in the request headers",
      });
      return;
    }
    const { user } = parse(req.headers.cookie);
    const form = new formidable.IncomingForm({
      multiples: true,
      hash: "sha256",
      keepExtensions: true,
      encoding: "utf-8",
    });
    form.parse(req, async (err, fields, { files }) => {
      try {
        if (err) {
          throw err;
        } else {
          if (Array.isArray(files)) {
            if (files.filter(({ name, hash }) => hash !== fields[`checksum;${name}`]).length > 1) {
              throw new Error("One or more checksum mismatched, potential transmission corruption detected");
            }
            const zip = new AdmZip();
            for (const file of files) {
              zip.addFile(file.name, readFileSync(file.path));
            }
            const filename = `${Date.now()}_${user}_aggregated.zip`;
            const destinationFilename = `submitted/${filename}`;
            const savedPath = `${process.env.NEXT_PUBLIC_UPLOAD_DIR}/${destinationFilename}`;
            zip.writeZip(savedPath);
            const { size } = statSync(savedPath);
            const submission: Submission = {
              stored_name: destinationFilename,
              upload_name: filename,
              assignment_config_id: parseInt(fields.assignmentConfigId, 10),
              size,
              checksum: sha256File(savedPath),
              user_id: parseInt(user, 10),
            };
            const createSubmission = await submit(req.headers.cookie!, submission);
            await decompress(createSubmission);
            res.json({
              status: "success",
            });
          } else {
            if (files.hash !== fields[`checksum;${files.name}`]) {
              return res.status(500).json({
                status: "error",
                error: "Checksum mismatched, potential transmission corruption detected",
              });
            }
            const destinationFilename = `submitted/${files.lastModifiedDate.getTime()}_${user}_${files.path.replace(
              `/tmp/`,
              "",
            )}`;
            const submission: Submission = {
              stored_name: destinationFilename,
              upload_name: files.name,
              assignment_config_id: parseInt(fields.assignmentConfigId, 10),
              size: files.size,
              checksum: files.hash,
              user_id: parseInt(user, 10),
            };
            try {
              copyFile(files.path, `${process.env.NEXT_PUBLIC_UPLOAD_DIR}/${destinationFilename}`, async (err) => {
                if (!err) {
                  const { id } = await submit(req.headers.cookie!, submission);
                  return res.json({
                    status: "success",
                    id,
                  });
                }
              });
            } catch (error: any) {
              if (error.message.includes(`Cannot read property 'createSubmission' of undefined`)) {
                return res.status(403).json({
                  status: "error",
                  error: "Timeline misalignment for requested submission",
                });
              } else {
                return res.status(500).json({
                  status: "error",
                  error: error.message,
                });
              }
            }
          }
        }
      } catch (error: any) {
        res.status(500).json({
          status: "error",
          error: error.message,
        });
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};

export default handler;

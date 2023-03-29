import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { utcToZonedTime } from "date-fns-tz";

async function handlePostAppeal(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body;
  const userId = body.userId;
  const assignmentConfigId = body.assignmentConfigId;

  try {
    // Search for previous appeal attempts and assignment config
    const {
      data: { data },
    } = await axios({
      method: "POST",
      headers: {
        "X-Hasura-Admin-Secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET,
      },
      url: `http://${process.env.API_URL}/v1/graphql`,
      data: {
        query: `query getAppealValidationData($assignmentConfigId: bigint!, $userId: bigint!) {
            appeals(
                limit: 1
                order_by: {updatedAt: desc}
                where: {
                    assignmentConfigId: {_eq: $assignmentConfigId}
                    userId: {_eq: $userId}
                }
            ) {
              status
            }
            assignmentConfig(id: $assignmentConfigId) {
              appealLimits
              appealStartAt
              appealStopAt
              isAppealAllowed
              assignment_appeals_aggregate(
                where: {
                    assignmentConfigId: {_eq: $assignmentConfigId}
                    userId: {_eq: $userId}
                }
              ) {
                aggregate {
                  count
                }
              }
            }
          }`,
        variables: { assignmentConfigId, userId },
      },
    });
    console.log(data);

    // Assignment config does no allow student to file appeal
    if (!data.assignmentConfig.isAppealAllowed) {
      return res.status(403).json({
        status: "error",
        error: "This assignment does not allow student grade appeals.",
      });
    }

    // Ban appealing when no more quota
    // appealLimits null means no limit on number of appeals each student can submit
    if (data.assignmentConfig.appealLimits !== null) {
      const appealQuota =
        data.assignmentConfig.appealLimits - data.assignmentConfig.assignment_appeals_aggregate.aggregate.count;
      if (appealQuota === 0) {
        return res.status(403).json({
          status: "error",
          error: "Student has exhausted all appeal quota.",
        });
      }
    }

    // Previous appeal is still PENDING
    if (data.appeals.length > 0 && data.appeals[0].status === "PENDING") {
      return res.status(403).json({
        status: "error",
        error: "Previous appeal has not been finalized.",
      });
    }

    // Appeal time violating appeal period
    if (!data.assignmentConfig.appealStartAt || !data.assignmentConfig.appealStopAt) {
      return res.status(403).json({
        status: "error",
        error: "Appeal period not configured. Please consult the course coordinator or TAs.",
      });
    }
    const now: Date = new Date();
    const appealStartAt: Date = utcToZonedTime(data.assignmentConfig.appealStartAt, "Asia/Hong_Kong");
    const appealStopAt: Date = utcToZonedTime(data.assignmentConfig.appealStopAt, "Asia/Hong_Kong");
    if (now.getTime() < appealStartAt.getTime()) {
      return res.status(403).json({
        status: "error",
        error: "Before appeal period.",
      });
    }
    if (now.getTime() >= appealStopAt.getTime()) {
      return res.status(403).json({
        status: "error",
        error: "Late appeal denied.",
      });
    }

    // Create appeal entry
    const result = await axios({
      method: "POST",
      headers: {
        "X-Hasura-Admin-Secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET,
      },
      url: `http://${process.env.API_URL}/v1/graphql`,
      data: {
        query: `mutation createAppeal($input: assignment_appeals_insert_input!) {
            createAppeal(object: $input) {
              id
            }
          }`,
        variables: { input: body },
      },
    });
    console.log(result);

    return res.status(201).json({
      status: "success",
      data: result.data.data,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
}

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method?.toUpperCase()) {
      case "POST":
        return handlePostAppeal(req, res);
      default:
        return res.status(400).json({
          status: "error",
          error: "Bad request.",
        });
    }
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
  },
};

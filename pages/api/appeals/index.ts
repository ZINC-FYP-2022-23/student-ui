import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

async function handlePostAppeal(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body;
  const userId = body.userId;
  const assignmentConfigId = body.assignmentConfigId;

  const now: Date = new Date();
  body.createdAt = zonedTimeToUtc(now, "Asia/Hong_Kong");
  body.updatedAt = zonedTimeToUtc(now, "Asia/Hong_Kong");
  body.assignment_appeal_messages.data[0].createdAt = zonedTimeToUtc(now, "Asia/Hong_Kong");

  try {
    // Search for previous appeal attempts and assignment config
    const {
      data: { data: appealValidationData },
    } = await axios({
      method: "POST",
      headers: {
        cookie: req.headers.cookie,
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
    console.log(appealValidationData);

    // Assignment config does not allow student to file appeal
    if (!appealValidationData.assignmentConfig.isAppealAllowed) {
      return res.status(403).json({
        status: "error",
        error: "This assignment does not allow student grade appeals.",
      });
    }

    // Ban appealing when no more quota
    // appealLimits null means no limit on number of appeals each student can submit
    if (appealValidationData.assignmentConfig.appealLimits !== null) {
      const appealQuota =
        appealValidationData.assignmentConfig.appealLimits -
        appealValidationData.assignmentConfig.assignment_appeals_aggregate.aggregate.count;
      if (appealQuota === 0) {
        return res.status(403).json({
          status: "error",
          error: "Student has exhausted all appeal quota.",
        });
      }
    }

    // Previous appeal is still PENDING
    if (appealValidationData.appeals.length > 0 && appealValidationData.appeals[0].status === "PENDING") {
      return res.status(403).json({
        status: "error",
        error: "Previous appeal has not been finalized.",
      });
    }

    // Appeal time violating appeal period
    if (!appealValidationData.assignmentConfig.appealStartAt || !appealValidationData.assignmentConfig.appealStopAt) {
      return res.status(403).json({
        status: "error",
        error: "Appeal period not configured. Please consult the course coordinator or TAs.",
      });
    }
    const appealStartAt: Date = utcToZonedTime(appealValidationData.assignmentConfig.appealStartAt, "Asia/Hong_Kong");
    const appealStopAt: Date = utcToZonedTime(appealValidationData.assignmentConfig.appealStopAt, "Asia/Hong_Kong");
    if (now.getTime() < appealStartAt.getTime()) {
      return res.status(403).json({
        status: "error",
        error: "Should not submit appeal before appeal period.",
      });
    }
    if (now.getTime() >= appealStopAt.getTime()) {
      return res.status(403).json({
        status: "error",
        error: "Late appeal denied.",
      });
    }

    // Create appeal entry
    const { data: appealResult } = await axios({
      method: "POST",
      headers: {
        cookie: req.headers.cookie,
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
    console.log(appealResult);

    return res.status(201).json({
      status: "success",
      data: appealResult.data,
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

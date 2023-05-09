import { Probot } from "probot";
import commands from "probot-commands";
import newIssue from "./new-issue";
import newPr from "./new-pr";
import assignedIssue from "./assigned-issue";
import pullRequestReview from "./pull-request-review";
import inProgressPrCard from "./project-v2-item-edited";
import codeReviewOk from "./code-review-ok";
import pullRequestClosed from "./pull-request-closed";

export = (app: Probot) => {
  app.on("issues.opened", newIssue);
  app.on("pull_request.opened", newPr);
  app.on("pull_request.closed", pullRequestClosed);
  app.on("issues.assigned", assignedIssue);
  app.on("pull_request_review.submitted", pullRequestReview);
  app.on("projects_v2_item.edited", inProgressPrCard);
  commands(app, "crok", codeReviewOk)
  commands(app, "CROK", codeReviewOk)
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

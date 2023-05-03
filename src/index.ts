import { Probot } from "probot";
import newIssue from "./new-issue";
import newPr from "./new-pr";
import closedPr from "./closed-pr";
import assignedIssue from "./assigned-issue";
import changesRequestedPr from "./changes-requested-pr";

export = (app: Probot) => {
  app.on("issues.opened", newIssue);
  app.on("pull_request.opened", newPr);
  app.on("pull_request.closed", closedPr);
  app.on("issues.assigned", assignedIssue);
  app.on("pull_request_review.submitted", changesRequestedPr);
  app.on("projects_v2_item.edited", async (context) => {
    console.log(context.payload);
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

import inProgressPrCard from "./in-progress-pr-card";
import plannedIssueCard from "./planned-issue-card";


export = async (context: any) => {
  if (context.payload.projects_v2_item.content_type === "PullRequest") {
    return inProgressPrCard(context);
  } else if (context.payload.projects_v2_item.content_type === "Issue") {
    return plannedIssueCard(context);
  }
}
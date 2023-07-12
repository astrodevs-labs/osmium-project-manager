import mergedPr from "./merged-pr";
import closedPr from "./closed-pr";

export = (context: any) => {
  if (context.payload.pull_request.merged)
    return mergedPr(context)
  else
    return closedPr(context)
}
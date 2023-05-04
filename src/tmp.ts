/*
import {Config} from "./Config";

export = async (context: any) => {
  console.log(context.payload);
  if (context.payload.projects_v2_item.content_type !== "PullRequest") {
    context.log("Not a PR");
    return;
  }

  const config: Config = await context.config('project-management.yml');
  console.log(config)
  if (!config) {
    context.log.error('No configuration found');
    throw new Error('No configuration found')
  }

  const query = `#graphql
    query ProjectV2ItemFieldSingleSelectValue($name: String!, $number: Int!, $owner: String!, $fieldName: String!) {
      repository(owner: $owner, name: $repositoryName2) {
        pullRequest(number: $number) {
          projectItems {
            nodes {
              fieldValueByName(name: $fieldName) {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  field {
                    ... on ProjectV2SingleSelectField {
                      id
                      options {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`

  const variables = {
    name: context.payload.repository.name,
    number: context.payload.pull_request.number,
    owner: context.payload.repository.owner.login,
    fieldName: config.cardReviewStatusFieldName
  }

  const result = await context.octokit.graphql(query, variables);
  const items = result.repository.pullRequest.projectItems.nodes;

  /!*for (const item of items) {
    // const statusField = item.fieldValueByName.field.id;
    // const inProgressOption = item.fieldValueByName.field.options.find((option: any) => option.name === config.cardReviewStatusInReview);
  }*!/
}*/

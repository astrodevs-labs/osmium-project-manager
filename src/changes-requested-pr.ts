import {Config} from "./Config";

export = async (context: any) => {
  if (context.payload.review.state !== 'changes_requested')
    return

  const config: Config = await context.config('project-management.yml');
  console.log(config)
  if (!config) {
    context.log.error('No configuration found');
    throw new Error('No configuration found')
  }

  const query = `#graphql
    query Nodes($number: Int!, $owner: String!, $repoName: String!, $name: String!) {
      repository(owner: $owner, name: $repoName) {
        pullRequest(number: $number) {
          projectItems(first: 100) {
            nodes {
              id
              project {
                id
              }
              fieldValueByName(name: $name) {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  id
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
    }`;

  const variables = {
    number: context.payload.pull_request.number,
    owner: context.payload.repository.owner.login,
    repoName: context.payload.repository.name,
    name: config.cardReviewStatusFieldName
  };

  const result = await context.octokit.graphql(query, variables)
  const projectItems = result.repository.pullRequest.projectItems.nodes

  const mutation = `mutation($input: UpdateProjectV2ItemFieldValueInput!) {
              updateProjectV2ItemFieldValue(input: $input) {
                projectV2Item {
                  id
                }
              }
            }`

  for (const item of projectItems) {
    const mutationVariables = {
      input: {
        projectId: item.project.id,
        itemId: item.id,
        value: {
          singleSelectOptionId: item.fieldValueByName?.field?.options.find((option: { name: string | undefined; }) => option.name === config.cardReviewStatusChangesRequested)?.id
        },
        fieldId: item.fieldValueByName?.field?.id
      }
    }

    await context.octokit.graphql(mutation, mutationVariables)
  }
}
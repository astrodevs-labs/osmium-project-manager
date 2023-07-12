import {Config} from "../../types/Config";
import DefaultValues from "../../types/DefaultValues";

export = async (context: any) => {
  const config: Config = (await context.octokit.config.get({
    owner: DefaultValues.organizationName,
    repo: DefaultValues.repositoryName,
    path: DefaultValues.path,
    branch: 'master'
  })).config;
  console.log(config)
  if (!config) {
    context.log.error('No configuration found');
    throw new Error('No configuration found')
  }

  const query = `#graphql
    query Repository($owner: String!, $name: String!, $fieldName: String!, $first: Int) {
      repository(owner: $owner, name: $name) {
        projectsV2(first: $first) {
          nodes {
            items(first: $first) {
              nodes {
                content {
                  ... on PullRequest {
                    projectItems(first: $first) {
                      nodes {
                        fieldValueByName(name: $fieldName) {
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
                        id
                        project {
                          id
                        }
                      }
                    }
                  }
                }
                id
                fieldValueByName(name: $fieldName) {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
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
            id
          }
        }
      }
    }`

  const variables = {
    name: 'test-project-organization',
    owner: 'astrodevs-labs',
    fieldName: config.cardReviewStatusFieldName,
    first: 10
  }

  const result = await context.octokit.graphql(query, variables);
  // console.log(result);
  // console.log(result.repository.projectsV2.nodes);

  const project = result.repository.projectsV2.nodes
    .find((project: any) => project.id === context.payload.projects_v2_item.project_node_id)
  // console.log(project?.items?.nodes);
  const cardItem = project?.items?.nodes.find((item: any) => item.id === context.payload.projects_v2_item.node_id);
  console.log(cardItem);
  const reviewStatusField = cardItem.fieldValueByName.field.id;

  if (context.payload.changes.field_value.field_node_id !== reviewStatusField) {
    context.log("Not the review status field");
    return;
  }

  if (cardItem.fieldValueByName.name !== config.cardReviewStatusInReview) {
    context.log("Not in review");
    return;
  }

  const cardsToMove = cardItem.content.projectItems.nodes;
  const mutation = `#graphql
    mutation($input: UpdateProjectV2ItemFieldValueInput!) {
      updateProjectV2ItemFieldValue(input: $input) {
        projectV2Item {
          id
        }
      }
    }`

  for (const card of cardsToMove) {
    const fieldId = card.fieldValueByName.field.id;
    const optionId = card.fieldValueByName.field.options.find((option: any) => option.name === config.cardReviewStatusInReview)?.id;

    const variables = {
      input: {
        projectId: card.project.id,
        itemId: card.id,
        value: {
          singleSelectOptionId: optionId
        },
        fieldId: fieldId
      }
    }

    console.log(variables)

    await context.octokit.graphql(mutation, variables);
  }
    
}
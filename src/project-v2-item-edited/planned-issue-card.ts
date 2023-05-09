import { Config } from "../types/Config";
import DefaultValues from "../types/DefaultValues";

type CardInformation = {
  cardId: string
  projectId: string
  fields: {
    configuration?: any;
    id: string
    name: string
    options?: {
      id: string
      name: string
    }[]
  }[]
}

const createDevelopmentCard = async (context: any, projectId: string, issueId: string) => {
    const createMutation = `#graphql
      mutation($input: AddProjectV2ItemByIdInput!) {
        addProjectV2ItemById(input: $input) {
          item {
            id
            project {
              fields(first: 20) {
                nodes {
                  ... on ProjectV2Field {
                    name
                    id
                  }
                  ... on ProjectV2SingleSelectField {
                    options {
                      name
                      id
                    }
                    name
                    id
                  }
                  ... on ProjectV2IterationField {
                    id
                    name
                    configuration {
                      iterations {
                        id
                        startDate
                        title
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`

  const createVariables = {
    input: {
      projectId: projectId,
      contentId: issueId
    }
  }

  const result = await context.octokit.graphql(createMutation, createVariables)
  const cardId = result.addProjectV2ItemById.item.id
  const cardFields = result.addProjectV2ItemById.item.project.fields.nodes

  const ret = {
    cardId: cardId,
    projectId: projectId,
    fields: cardFields
  }

  console.log(ret)
  return ret
}

const setFields = async (context: any, cardInformation: CardInformation, config: Config, sprint: string, type: string, load: number) => {
  const loadField = cardInformation.fields.find(field => field.name === config.cardLoadFieldName);
  const typeField = cardInformation.fields.find(field => field.name === config.cardTypeFieldName);
  const typeOption = typeField?.options?.find(option => option.name === type);
  const iterationField = cardInformation.fields.find(field => field.name === config.cardIterationFieldName);
  const iterationOption = iterationField?.configuration?.iterations?.find((iteration: { startDate: string; }) => iteration.startDate === sprint);
  const statusField = cardInformation.fields.find(field => field.name === "Status");
  const statusOption = statusField?.options?.find(option => option.name === config.cardDevelopmentStatusStart);

  const mutation = `#graphql
  mutation($input: UpdateProjectV2ItemFieldValueInput!) {
      updateProjectV2ItemFieldValue(input: $input) {
          projectV2Item {
              id
          }
      }
  }`

  const loadVariables = {
    input: {
      projectId: cardInformation.projectId,
      itemId: cardInformation.cardId,
      value: {
        number: load
      },
      fieldId: loadField?.id
    }
  }
  console.log("loadVariables", loadVariables)

  const typeVariables = {
    input: {
      projectId: cardInformation.projectId,
      itemId: cardInformation.cardId,
      value: {
        singleSelectOptionId: typeOption?.id
      },
      fieldId: typeField?.id
    }
  }
  console.log("typeVariables", typeVariables)

  const iterationVariables = {
    input: {
      projectId: cardInformation.projectId,
      itemId: cardInformation.cardId,
      value: {
        iterationId: iterationOption?.id
      },
      fieldId: iterationField?.id
    }
  }
  console.log("iterationVariables", iterationVariables)

  const statusVariables = {
    input: {
      projectId: cardInformation.projectId,
      itemId: cardInformation.cardId,
      value: {
        singleSelectOptionId: statusOption?.id
      },
      fieldId: statusField?.id
    }
  }
  console.log("statusVariables", statusVariables)

  await context.octokit.graphql(mutation, loadVariables)
  await context.octokit.graphql(mutation, typeVariables)
  await context.octokit.graphql(mutation, iterationVariables)
  await context.octokit.graphql(mutation, statusVariables)
}

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
    query Repository($owner: String!, $name: String!, $first: Int) {
      repository(owner: $owner, name: $name) {
        projectsV2(first: $first) {
          nodes {
            items(first: $first) {
              nodes {
                content {
                  ... on Issue {
                    id
                  }
                }
                id
                fieldValues(first: $first) {
                  nodes {
                    ... on ProjectV2ItemFieldIterationValue {
                      startDate
                      field {
                        ... on ProjectV2IterationField {
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldNumberValue {
                      number
                      field {
                        ... on ProjectV2Field {
                          name
                        }
                      }
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      id
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                          options {
                            name
                            id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            id
            title
          }
        }
      }
    }`;

  const variables = {
    owner: DefaultValues.organizationName,
    name: DefaultValues.repositoryName,
    fieldName: config.cardPreparationStatusFieldName,
    first: 15
  }

  const result = await context.octokit.graphql(query, variables)
  console.log(result)
  const project = result.repository.projectsV2.nodes
    .find((project: any) => project.id === context.payload.projects_v2_item.project_node_id)
    // console.log(project?.items?.nodes);
  const cardItem = project?.items?.nodes.find((item: any) => item.id === context.payload.projects_v2_item.node_id);
  console.log(cardItem);
  console.log(cardItem?.fieldValues?.nodes);
  const preparationStatus = cardItem?.fieldValues?.nodes.find((fieldValue: any) => fieldValue.field?.name === config.cardPreparationStatusFieldName);
  console.log(preparationStatus);

  if (!preparationStatus) {
    context.log.error('No preparation status found');
    return
  }
  if (preparationStatus.name !== config.cardStatusPlanned) {
    context.log.error('Card is not planned');
    return;
  }

  const developmentProject = result.repository.projectsV2.nodes.find((project: any) => project.title === config.projectDevelopmentName);
  const issueId = cardItem.content.id;
  const infos = await createDevelopmentCard(context, developmentProject.id, issueId);
  console.log(infos)
  const sprint = cardItem.fieldValues.nodes.find((fieldValue: any) => fieldValue.field?.name === config.cardIterationFieldName).startDate;
  console.log(sprint)
  const load = cardItem.fieldValues.nodes.find((fieldValue: any) => fieldValue.field?.name === config.cardLoadFieldName).number;
  const type = cardItem.fieldValues.nodes.find((fieldValue: any) => fieldValue.field?.name === config.cardTypeFieldName).name;
  await setFields(context, infos, config, sprint, type, load);

}
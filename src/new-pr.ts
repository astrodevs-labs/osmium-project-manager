import { Config } from "./types/Config";

type Project = {
  id: string
  title: string
}

type CardInformation = {
  cardId: string
  projectId: string
  fields: {
    id: string
    name: string
    options?: {
      id: string
      name: string
    }[]
  }[]
}

const extractProjects = async (context: any, config: Config): Promise<{ development: Project, management: Project}> => {
  const query = `
              query($organization: String!) {
                organization(login: $organization) {
                  projectsV2(first: 10) {
                    nodes {
                      id
                      title
                    }
                  }
                }
              }
            `
  const variables = {
    organization: context.payload.repository.owner.login
  }

  const projects = await context.octokit.graphql(query, variables)
  console.log(process.env.MANAGEMENT_PROJECT_NAME)
  const management = projects.organization.projectsV2.nodes.find((project: { title: string | undefined; }) => project.title === config.projectManagementName)
  const development = projects.organization.projectsV2.nodes.find((project: { title: string | undefined; }) => project.title === config.projectDevelopmentName)
  if (!management) {
    throw new Error('Project Management project not found')
  } else if (!development) {
    throw new Error('Project Development project not found')
  }

  return { development, management }
}

const createCards = async (context: any, {management, development}: { development: Project, management: Project}): Promise<{ development: CardInformation, management: CardInformation}> => {
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
                }
              }
            }
          }
        }
      }
    }`

  const createManagementVariables = {
    input: {
      projectId: management.id,
      contentId: context.payload.pull_request.node_id
    }
  }

  const createDevelopmentVariables = {
    input: {
      projectId: development.id,
      contentId: context.payload.pull_request.node_id
    }
  }

  const managementResult = await context.octokit.graphql(createMutation, createManagementVariables)
  const developmentResult = await context.octokit.graphql(createMutation, createDevelopmentVariables)

  const managementCardId = managementResult.addProjectV2ItemById.item.id
  const managementCardFields = managementResult.addProjectV2ItemById.item.project.fields.nodes
  const developmentCardId = developmentResult.addProjectV2ItemById.item.id
  const developmentCardFields = developmentResult.addProjectV2ItemById.item.project.fields.nodes

  return {
    management: {
      cardId: managementCardId,
      projectId: management.id,
      fields: managementCardFields
    },
    development: {
      cardId: developmentCardId,
      projectId: development.id,
      fields: developmentCardFields
    }
  }
}

const setStatus = async (context: any, {development, management}: {development: CardInformation, management: CardInformation}, config: Config) => {
  const mutation = `mutation($input: UpdateProjectV2ItemFieldValueInput!) {
              updateProjectV2ItemFieldValue(input: $input) {
                projectV2Item {
                  id
                }
              }
            }`



  const managementReviewStatusField = management.fields.find(field => field.name === config.cardReviewStatusFieldName)
  const managementStartOption = managementReviewStatusField?.options?.find(option => option.name === config.cardManagementReviewStatusStart)
  const developmentReviewStatusField = development.fields.find(field => field.name === config.cardReviewStatusFieldName)
  const developmentStartOption = developmentReviewStatusField?.options?.find(option => option.name === config.cardDevelopmentReviewStatusFieldName)

  const managementVariables = {
    input: {
      projectId: management.projectId,
      itemId: management.cardId,
      value: {
        singleSelectOptionId: managementStartOption?.id
      },
      fieldId: managementReviewStatusField?.id
    }
  }
  const developmentVariables = {
    input: {
      projectId: development.projectId,
      itemId: development.cardId,
      value: {
        singleSelectOptionId: developmentStartOption?.id
      },
      fieldId: developmentReviewStatusField?.id
    }
  }

  await context.octokit.graphql(mutation, managementVariables)
  await context.octokit.graphql(mutation, developmentVariables)
}

export = async (context: any) => {
  const config: Config = await context.config("project-management.yml")
  console.log(config)
  if (!config) {
    context.log.error('No configuration found');
    throw new Error('No configuration found')
  }
  const projects = await extractProjects(context, config)
  const cards = await createCards(context, projects)
  await setStatus(context, cards, config)
}
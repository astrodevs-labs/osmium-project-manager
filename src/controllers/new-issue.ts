// import { EmitterWebhookEvent } from "@octokit/webhooks/dist-types/types";
// import { Config} from "../types/Config";
import {injectable} from "inversify";
import {IController} from "./IController";
import {IssueService} from "../services/Issue.service";
import {ConfigService} from "../services/Config.service";
/*
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

const extractProjects = async (context: any, config: Config): Promise<Project> => {
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
  const project = projects.organization.projectsV2.nodes.find((project: { title: string | undefined }) => project.title === config.projectManagementName)
  if (!project) {
    throw new Error('Project Management project not found')
  }
  console.log(project)
  return project
}

const createCard = async (context: any, project: Project): Promise<CardInformation> => {
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

  const createVariables = {
    input: {
      projectId: project.id,
      contentId: context.payload.issue.node_id
    }
  }

  const result = await context.octokit.graphql(createMutation, createVariables)
  const cardId = result.addProjectV2ItemById.item.id
  const cardFields = result.addProjectV2ItemById.item.project.fields.nodes

  const ret = {
    cardId: cardId,
    projectId: project.id,
    fields: cardFields
  }

  console.log(ret)
  return ret
}

const setStatus = async (context: any, cardInformation: CardInformation, config: Config) => {
  const mutation = `#graphql
    mutation($input: UpdateProjectV2ItemFieldValueInput!) {
      updateProjectV2ItemFieldValue(input: $input) {
        projectV2Item {
          id
        }
      }
    }`


  const statusField = cardInformation.fields.find(field => field.name === 'Status')
  const toDescribeOption = statusField?.options?.find(option => option.name === config.projectManagementStatusStart)

  const variables = {
    input: {
      projectId: cardInformation.projectId,
      itemId: cardInformation.cardId,
      value: {
        singleSelectOptionId: toDescribeOption?.id
      },
      fieldId: statusField?.id
    }
  }

  await context.octokit.graphql(mutation, variables)
}

const setLabel = async (context: any, cardInformation: CardInformation, config: Config) => {
  const mutation = `mutation($input: UpdateProjectV2ItemFieldValueInput!) {
              updateProjectV2ItemFieldValue(input: $input) {
                projectV2Item {
                  id
                }
              }
            }`

  /*
  LabelsService.getTypeFromLabels(context.payload.issue.labels, config)
   * /
  const isUserStory = context.payload.issue.labels.some((label: { name: string }) => label.name === config.userStoryLabel)
  const isBug = context.payload.issue.labels.some((label: { name: string }) => label.name === config.bugLabel)
  const isTask = context.payload.issue.labels.some((label: { name: string }) => label.name === config.taskLabel)
  const isTechnicalStory = context.payload.issue.labels.some((label: { name: string }) => label.name === config.technicalStoryLabel)
  let optionToFind = '';

  if (isUserStory && !isTechnicalStory) {
    optionToFind = config.userStoryLabel
  } else if (isTechnicalStory) {
    optionToFind = config.technicalStoryLabel
  } else if (isBug) {
    optionToFind = config.bugLabel
  } else if (isTask) {
    optionToFind = config.taskLabel
  }
  ////////////

  const typeField = cardInformation.fields.find(field => field.name === config.cardTypeFieldName)
  const userStoryOption = typeField?.options?.find(option => option.name === optionToFind)

  const variables = {
    input: {
      projectId: cardInformation.projectId,
      itemId: cardInformation.cardId,
      value: {
        singleSelectOptionId: userStoryOption?.id
      },
      fieldId: typeField?.id
    }
  }

  await context.octokit.graphql(mutation, variables)
}

export default async (context: any) => {
  const config: Config = await context.config('project-management.yml');
  console.log(config)
  if (!config) {
    context.log.error('No configuration found');
    throw new Error('No configuration found')
  }
  const project = await extractProjects(context, config);
  const infos = await createCard(context, project);
  await setStatus(context, infos, config);
  await setLabel(context, infos, config);
}
*/
@injectable()
export class NewIssueController implements IController {
  constructor(
    private issueService: IssueService,
    private configService: ConfigService
  ) {}

  async run(context: any): Promise<void> {
    try {
      await this.configService.setContext(context);
      const config = await this.configService.retrieveConfig();

      this.issueService.setConfig(config);
      this.issueService.setContext(context);
      await this.issueService.createCard()
    } catch (e) {
      console.error(e)
    }
  }

}
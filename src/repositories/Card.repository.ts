import {injectable} from "inversify";

export interface NewCard {
  id: string
  project: {
    fields: {
      nodes: {
        name: string
        id: string
        options: {
          name: string
          id: string
        }[]
      }[]
    }
  }
}

type FieldValue = {
  singleSelectOptionId: string
}

@injectable()
export class CardRepository {
  async createFromItem(octokit: any, projectId: string, item: string): Promise<NewCard> {
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
        projectId,
        contentId: item
      }
    }

    const result = await octokit.graphql(createMutation, createVariables)
    return result.addProjectV2ItemById.item
  }
  async updateFieldValue(octokit: any, projectId: string, cardId: string, fieldId: string, value: FieldValue) {
      const mutation = `#graphql
        mutation($input: UpdateProjectV2ItemFieldValueInput!) {
          updateProjectV2ItemFieldValue(input: $input) {
            projectV2Item {
              id
            }
          }
        }`

    const variables = {
      input: {
        projectId,
        itemId: cardId,
        value,
        fieldId
      }
    }

    await octokit.graphql(mutation, variables)
  }

  async delete(octokit: any, projectId: string, cardId: string) {
    const mutation = `#graphql
      mutation DeleteProjectV2Item($input: DeleteProjectV2ItemInput!) {
        deleteProjectV2Item(input: $input) {
          deletedItemId
        }
      }`;

    const variables = {
      input: {
        itemId: cardId,
        projectId
      },
    };

    await octokit.graphql(mutation, variables)
  }
}
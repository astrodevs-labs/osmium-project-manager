import {Config} from "../types/Config";

export = async (context: any, command: any) => {
  const config: Config = await context.config('project-management.yml');
  console.log(config)
  if (!config) {
    context.log.error('No configuration found');
    throw new Error('No configuration found')
  }
  console.log(context.payload)
  console.log(command)

    const query = `#graphql
    query PullRequest($number: Int!, $owner: String!, $name: String!, $fieldName: String!) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $number) {
          projectItems(first: 100) {
            nodes {
              fieldValueByName(name: $fieldName) {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  field {
                    ... on ProjectV2SingleSelectField {
                      id
                      options {
                        name
                        id
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
    }`;

  const variables = {
    number: context.payload.issue.number,
    owner: context.payload.repository.owner.login,
    name: context.payload.repository.name,
    fieldName: config.cardReviewStatusFieldName
  }

  const result = await context.octokit.graphql(query, variables)
  const cards = result.repository.pullRequest.projectItems.nodes

  const mutation = `#graphql
    mutation($input: UpdateProjectV2ItemFieldValueInput!) {
      updateProjectV2ItemFieldValue(input: $input) {
        projectV2Item {
          id
        }
      }
    }`

  for (const card of cards) {
    console.log(card.fieldValueByName.field.options)
    console.log(config.cardReviewStatusFunctionalReview)
    const optionId = card.fieldValueByName.field.options.find((option: any) => option.name === config.cardReviewStatusFunctionalReview).id
    const variables = {
      input: {
        projectId: card.project.id,
        itemId: card.id,
        value: {
          singleSelectOptionId: optionId
        },
        fieldId: card.fieldValueByName.field.id
      }
    }

    await context.octokit.graphql(mutation, variables)
  }
}
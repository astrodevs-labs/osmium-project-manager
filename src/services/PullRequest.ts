export interface Card {
  id: string;
  project: {
    id: string;
  }
}

export interface FieldValueByName {
  id: string;
  field: {
    id: string;
    options: {
      id: string;
      name: string;
    }
  }
}

export class PullRequestService {
  static async getLinkedProjectCards(octokit: any, owner: string, repo: string, prNumber: string): Promise<Card[]> {
      const query = `#graphql
        query Nodes($number: Int!, $owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
              projectItems(first: 100) {
                nodes {
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
      number: prNumber,
      owner: owner,
      name: repo,
    };

    const result = await octokit.graphql(query, variables)

    return result.repository.pullRequest.projectItems.nodes
  }

  static async getlinkedProjectCardsWithFieldValue(octokit: any, owner: string, repo: string, prNumber: string, fieldName: string): Promise<(Card & FieldValueByName)[]> {
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
      number: prNumber,
      owner,
      repoName: repo,
      name: fieldName
    };

    const result = await octokit.graphql(query, variables)
    return result.repository.pullRequest.projectItems.nodes
  }
}
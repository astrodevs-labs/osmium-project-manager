import {injectable} from "inversify";

export interface Issue {
  title: string;
  trackedInIssues: { nodes: Issue[] };
}

@injectable()
export class IssueRepository {

  private static _issueTrakedTemplate = `
                      trackedInIssues(first: 1) {
                      nodes {
                        title
                        labels(first: 20) {
                          nodes {
                            name
                          }
                        }
                        #CHILD
                      }
                    }`;

  private createTrackedIssuesReq(recurse: number) : string {
    let query = `query Nodes($number: Int!, $repo: String!, $organization: String!) {
              organization(login: $organization) {
                repository(name: $repo) {
                  issue(number: $number) {
                    title
                    #CHILD
                  }
                }
              }
            }`;

    do {
      query = query.replace("#CHILD", IssueRepository._issueTrakedTemplate)
    } while (recurse--);

    return query.replace("#CHILD", "");
  }

  async getParents(context: any, org: string, repo: string, issue: string, recurse: number) : Promise<IssueRepository> {
    const query = this.createTrackedIssuesReq(recurse);

    const variables = {
      number: parseInt(issue, 10),
      repo: repo,
      organization: org
    }

    return await context.octokit.graphql(query, variables);
  }
}
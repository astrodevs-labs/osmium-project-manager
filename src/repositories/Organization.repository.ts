import {injectable} from "inversify";

export interface Project {
  title: string;
  id: string;
}

@injectable()
export class OrganizationRepository {

    async getProjects(octokit: any, org: string) : Promise<Project[]> {
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
        }`;

      const variables = {
        organization: org
      }

      const result = await octokit.graphql(query, variables);

      const ret = result?.organization?.projectsV2?.nodes;
      if (!ret) {
        if (result?.organization) {
          throw new Error(`No projects found for ${org}`);
        }
        throw new Error(`Organization ${org} not found`);
      }
      return ret;
    }

    async getProject(octokit: any, org: string, project: string) : Promise<Project> {
        const projects = await this.getProjects(octokit, org);
        const found = projects.find((proj) => proj.title === project);

        if (!found) {
            throw new Error(`Project ${project} not found`);
        }
        return found;
    }
}
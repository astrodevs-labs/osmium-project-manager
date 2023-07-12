import {injectable} from "inversify";

@injectable()
export class RepositoryRepository {
  async createDispatchEvent(octokit: any, owner: string, repo: string, eventType: string, clientPayload: any) {
    return octokit.repos.createDispatchEvent({
      owner: owner,
      repo: repo,
      event_type: eventType,
      client_payload: clientPayload
    });
  }
}
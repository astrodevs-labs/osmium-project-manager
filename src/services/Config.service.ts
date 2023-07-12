import {mixinContextable} from "../utils/Contextable";
import {Config} from "../types/Config";
import configLocation from "../config/configLocation.config";
import {injectable} from "inversify";

@injectable()
export class ConfigService extends mixinContextable(class {}) {
  async retrieveConfig(): Promise<Config> {
    if (!this.context) {
      throw new Error("Context not set");
    }

    const config: Config = await this.context.config(configLocation.filepath);

    if (!config) {
      throw new Error("No configuration found");
    }
    return config;
  }

  async retrieveConfigFromRepo(owner: string, repo: string): Promise<Config> {
    if (!this.context) {
      throw new Error("Context not set");
    }

    const config: Config = await this.context.octokit.config.get({
      owner,
      repo,
      path: configLocation.absoluteFilepath,
      branch: configLocation.branch
    });

    if (!config) {
      throw new Error("No configuration found");
    }
    return config;
  }
}
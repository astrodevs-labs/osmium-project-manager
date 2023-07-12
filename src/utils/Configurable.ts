import {Config} from "../types/Config";

export class Configurable {
  protected config?: Config;

  public setConfig(config: Config) {
    this.config = config;
  }
}
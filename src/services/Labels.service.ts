import {Configurable} from "../utils/Configurable";
import {injectable} from "inversify";

@injectable()
export class LabelsService extends Configurable {
  private async _checkTypeFromLabels(labels: { name: string}[]): Promise<{ isUserStory: boolean, isBug: boolean, isTask: boolean, isTechnicalStory: boolean }> {
    if (!this.config) {
      throw new Error("Config not set");
    }
    
    return {
      isUserStory: labels.some((label: { name: string }) => label.name === this.config?.userStoryLabel),
      isBug: labels.some((label: { name: string }) => label.name === this.config?.bugLabel),
      isTask: labels.some((label: { name: string }) => label.name === this.config?.taskLabel),
      isTechnicalStory: labels.some((label: { name: string }) => label.name === this.config?.technicalStoryLabel),
    }
  }
  
  async getTypeValueFromLabels(labels: { name: string}[]): Promise<string> {
    const { isUserStory, isBug, isTask, isTechnicalStory } = await this._checkTypeFromLabels(labels);

    if (isUserStory && !isTechnicalStory) {
      return this.config!.userStoryLabel
    } else if (isTechnicalStory) {
      return this.config!.technicalStoryLabel
    } else if (isBug) {
      return this.config!.bugLabel
    } else if (isTask) {
      return this.config!.taskLabel
    } else {
      throw new Error("No type found")
    }
  }
}
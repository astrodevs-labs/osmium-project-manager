import {injectable} from "inversify";
import {LabelsService} from "./Labels.service";
import {CardRepository, NewCard} from "../repositories/Card.repository";
import {Configurable} from "../utils/Configurable";
import {mixinContextable} from "../utils/Contextable";
import {OrganizationRepository, Project} from "../repositories/Organization.repository";

@injectable()
export class IssueService extends mixinContextable(Configurable) {
  constructor(
    private readonly _labelsService: LabelsService,
    private readonly _cardRepository: CardRepository,
    private readonly _organizationRepository: OrganizationRepository
  ) {
    super();
  }

  private async _setNewManagementCardStatus(project: Project, card: NewCard) {
    const statusField = card.project.fields.nodes.find(field => field.name === 'Status')
    const toDescribeOption = statusField?.options?.find(option => option.name === this.config!.projectManagementStatusStart)
    if (!statusField || !toDescribeOption) {
      throw new Error("Status field or option not found");
    }
    await this._cardRepository.updateFieldValue(
      this.context.octokit,
      project.id,
      card.id,
      statusField!.id,
      {
        singleSelectOptionId: toDescribeOption?.id
      }
    );
  }

  private async _setNewManagementCardType(project: Project, card: NewCard) {
    const optionToFind = await this._labelsService.getTypeValueFromLabels(this.context.payload.issue.labels);
    const typeField = card.project.fields.nodes.find(field => field.name === this.config!.cardTypeFieldName)
    const typeOption = typeField?.options?.find(option => option.name === optionToFind)

    if (!typeField || !typeOption) {
      throw new Error("Type field or option not found");
    }
    await this._cardRepository.updateFieldValue(
      this.context.octokit,
      project.id,
      card.id,
      typeField!.id,
      {
        singleSelectOptionId: typeOption?.id
      }
    );
  }

  public async createCard() {
    if (!this.config) {
      throw new Error("Config not set");
    } else if (!this.context) {
      throw new Error("Context not set");
    }

    this._labelsService.setConfig(this.config);

    const project = await this._organizationRepository.getProject(
      this.context.octokit,
      this.context.payload.repository.owner.login,
      this.config!.projectManagementName
    );
    const card = await this._cardRepository.createFromItem(
      this.context.octokit,
      project.id,
      this.context.payload.issue.node_id
    );
    await this._setNewManagementCardStatus(project, card);
    await this._setNewManagementCardType(project, card);
  }
}
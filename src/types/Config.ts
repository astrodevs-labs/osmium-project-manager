export type Config = {
  projectManagementName: string
  projectDevelopmentName: string
  projectManagementStatusStart: string

  userStoryLabel: string
  bugLabel: string
  taskLabel: string
  technicalStoryLabel: string


  cardTypeFieldName: string
  cardReviewStatusFieldName: string
  cardPreparationStatusFieldName: string
  cardLoadFieldName: string
  cardIterationFieldName: string
  cardManagementReviewStatusStart: string
  cardDevelopmentReviewStatusFieldName: string
  cardReviewStatusChangesRequested: string
  cardReviewStatusInReview: string
  cardReviewStatusFunctionalReview: string
  cardReviewStatusStaging: string
  cardReviewStatusDone: string
  cardStatusPlanned: string
  cardDevelopmentStatusStart: string

  cardTypeUserStory: string
  cardTypeTechnicalStory: string
  cardTypeBug: string
  cardTypeTask: string

  branchUserStoryPrefix: string
  branchTechnicalStoryPrefix: string
  branchBugPrefix: string
}
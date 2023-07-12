import { Config } from "../types/Config";

const findBranchNodes = async (context: any, config: Config) => {
  let branchName = ''
  const isUserStory = context.payload.issue.labels.some((label: { name: string }) => label.name === config.userStoryLabel)
  const isBug = context.payload.issue.labels.some((label: { name: string }) => label.name === config.bugLabel)
  const isTask = context.payload.issue.labels.some((label: { name: string }) => label.name === config.taskLabel)
  const isTechnicalStory = context.payload.issue.labels.some((label: { name: string }) => label.name === config.technicalStoryLabel)
  const sanitizedTitle = context.payload.issue.title.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()

  if (isUserStory && !isTechnicalStory)
    branchName = `${process.env.BRANCH_USER_STORY_PREFIX}/${sanitizedTitle}`
  else if (isBug)
    branchName = `${process.env.BRANCH_BUG_PREFIX}/${sanitizedTitle}`
  else if (isTechnicalStory)
    branchName = `${process.env.BRANCH_TECHNICAL_STORY_PREFIX}/${sanitizedTitle}`

  if (!isTask && (isUserStory || isBug || isTechnicalStory)) {
    console.log(`Branch name: ${branchName}`)
    return {
      branches: ['dev', branchName.replace(/--/g, '-')],
      titles: ['', process.env.TITLE]
    }
  }

  const query = `query Nodes($number: Int!, $repo: String!, $organization: String!) {
              organization(login: $organization) {
                repository(name: $repo) {
                  issue(number: $number) {
                    trackedInIssues(first: 1) {
                      nodes {
                        title
                        labels(first: 20) {
                          nodes {
                            name
                          }
                        }
                        trackedInIssues(first: 1) {
                          nodes {
                            title
                            labels(first: 20) {
                              nodes {
                                name
                              }
                            }
                            trackedInIssues(first: 1) {
                              nodes {
                                title
                                labels(first: 20) {
                                  nodes {
                                    name
                                  }
                                }
                                trackedInIssues(first: 1) {
                                  nodes {
                                    title
                                    labels(first: 20) {
                                      nodes {
                                        name
                                      }
                                    }
                                    trackedInIssues(first: 1) {
                                      nodes {
                                        title
                                        labels(first: 20) {
                                          nodes {
                                            name
                                          }
                                        }
                                        trackedInIssues(first: 1) {
                                          nodes {
                                            title
                                            labels(first: 20) {
                                              nodes {
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
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }`

  const variables = {
    number: parseInt(context.payload.issue.number, 10),
    repo: context.payload.repository.name,
    organization: context.payload.repository.owner.login
  }

  const result = await context.octokit.graphql(query, variables)
  let node = result.organization.repository.issue.trackedInIssues.nodes[0]
  const nodes = [node.title]
  for (; node.trackedInIssues.nodes.length > 0; node = node.trackedInIssues.nodes[0]) {
    console.log(node)
    nodes.push(node.title)
  }
  console.log("end node", node)
  console.log("labels", node.labels.nodes)
  const isRootUserStory = node.labels.nodes.some((label: { name: string | undefined; }) => label.name === config.cardTypeUserStory)
  const isRootBug = node.labels.nodes.some((label: { name: string | undefined; }) => label.name === config.cardTypeBug)
  const isRootTechnicalStory = node.labels.nodes.some((label: { name: string | undefined; }) => label.name === config.cardTypeTechnicalStory)

  const sanitizedNodes = nodes.map(node => node.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().replace(/--/g, '-'))

  let prefix = ''

  if (isRootUserStory && !isRootTechnicalStory) {
    prefix = config.branchUserStoryPrefix
  } else if (isRootBug) {
    prefix = config.branchBugPrefix
  } else if (isRootTechnicalStory) {
    prefix = config.branchTechnicalStoryPrefix
  }

  console.log(`Branch name: ${branchName}`)
  let branches = ['dev']
  for (let i = 0; i < sanitizedNodes.length; i++) {
    branches.push(`${prefix}/${sanitizedNodes.reverse().slice(0, i + 1).join('/').toLowerCase()}`)
  }
  branches.push(`${prefix}/${sanitizedNodes.reverse().join('/')}/${sanitizedTitle}`)
  return { branches, titles: ['', ...nodes.reverse(), context.payload.issue.title] }
}

const formatBranchNodes = (context: any, {branches, titles}: { branches: string[], titles: string[]}) => {
  let output = []

  console.log(branches)

  for (let i = 0; i < branches.length - 1; i++) {
    const branch = branches[i]
    const nextBranch = branches[i + 1]
    const title = titles[i + 1]

    console.log(branch, nextBranch)

    output.push({
      baseBranch: branch === 'dev' ? 'dev' : `${branch}-staging`,
      headBranch: `${nextBranch}-staging`,
      prTitle: title,
      issueNumber: context.payload.issue.number,
    })
  }
  console.log(output)
  return output
}

export = async (context: any) => {
  const config: Config = await context.config('project-management.yml');
  console.log(config)
  if (!config) {
    context.log.error('No configuration found');
    throw new Error('No configuration found')
  }
  const informations = await findBranchNodes(context, config);
  const branches = formatBranchNodes(context, informations)

  for (let i = 0; i < branches.length; i++) {
    await context.octokit.rest.repos.createDispatchEvent({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      event_type: 'create-branch-and-draft',
      client_payload: branches[i]
    })
  }
}
export = async (context: any) => {
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
    number: context.payload.pull_request.number,
    owner: context.payload.repository.owner.login,
    name: context.payload.repository.name,
  };

  const result = await context.octokit.graphql(query, variables)
  const projectItems = result.repository.pullRequest.projectItems.nodes

  const mutation = `mutation DeleteProjectV2Item($input: DeleteProjectV2ItemInput!) {
              deleteProjectV2Item(input: $input) {
                deletedItemId
              }
            }`;

  for (const item of projectItems) {
    const variables = {
      input: {
        itemId: item.id,
        projectId: item.project.id,
      },
    };

    await context.octokit.graphql(mutation, variables)
  }
}
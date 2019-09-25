import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const token = core.getInput("repo-token", { required: true });

    await addLabels(new github.GitHub(token));
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

async function addLabels(client: github.GitHub) {
  console.log(github.context.payload.issue);
  const prPayload = github.context.payload.pull_request;
  if (!prPayload) {
    throw Error("Could not get pull request number from context, exiting");
  }
  const { owner, repo } = github.context.repo;
  const { repository } = await client.graphql(
    `
      query PullRequest($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $number) {
            title
            number
            baseRefName
            headRefName
          }
        }
      }
      `,
    {
      owner: owner,
      repo: repo,
      number: prPayload.number
    }
  );

  const PR = { ...repository.pullRequest };

  console.log(PR);
  //   await client.issues.addLabels()
}

run();

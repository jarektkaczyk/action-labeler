import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const token = core.getInput("repo-token", { required: true })
    const prPayload = github.context.payload.pull_request
    if (!prPayload) {
      throw Error("Could not get pull request number from context, exiting")
    }

    await addLabels(new github.GitHub(token), prPayload)
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

async function addLabels(client: github.GitHub, prPayload) {
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
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      number: prPayload.number
    }
  )

  const PR = { ...repository.pullRequest }

  const isWip = PR.title.match(/\bwip\b/i)
  const isHotfix = PR.headRefName.match(/^hotfix/)
  const isFeature = PR.headRefName.match(/^feature/)
  const isRelease = PR.headRefName.match(/^release/)
  const targetsFeature = PR.baseRefName.match(/^feature/)

  const labels: string[] = []
  if (isWip) {
      labels.push('dnm')
  } else if (isHotfix) {
      labels.push('hotfix')
  } else if (isRelease) {
      labels.push('release')
  } else if (isFeature && targetsFeature) {
      labels.push('partial')
  } else if (isFeature) {
      labels.push('feature')
  }

  if (labels.length > 0) {
    await client.issues.addLabels({
        // ...github.context.repo,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: PR.number,
        labels: labels
      })
  }
}

run();

import * as core from "@actions/core";
import * as github from "@actions/github";

type PullRequest = {
  title: string;
  headRefName: string;
  baseRefName: string;
  number: number;
};

type LabelsMap = {
  wip?: string;
  hotfix?: string;
  feature?: string;
  partial?: string;
  release?: string;
};

async function run() {
  try {
    const token = core.getInput("repo-token", { required: true });
    const labelsMap = core.getInput("labels", { required: true });
    const prNumber = getPrNumber();
    if (!prNumber) {
      throw Error("PR number missing, died");
    }

    await addLabels(new github.GitHub(token), prNumber, labelsMap);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

function getPrNumber(): number | undefined {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

async function addLabels(client: github.GitHub, prNumber: number, labelsMap: object) {
  const pullRequest = await getPullRequest(client, prNumber);
  const labels = parsePullRequest(pullRequest, labelsMap);

  if (labels.length > 0) {
    await client.issues.addLabels({
      // ...github.context.repo,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: prNumber,
      labels: labels
    });
  }
}

function parsePullRequest(
  pullRequest: PullRequest,
  {
    wip = '',
    hotfix = '',
    feature = '',
    partial = '',
    release = ''
  }: LabelsMap
): string[] {
  const isWip = pullRequest.title.match(/\bwip\b/i);
  const isHotfix = pullRequest.headRefName.match(/^hotfix/);
  const isFeature = pullRequest.headRefName.match(/^feature/);
  const isRelease = pullRequest.headRefName.match(/^release/);
  const targetsFeature = pullRequest.baseRefName.match(/^feature/);

  const labels: string[] = [];
  if (isWip) {
    labels.push(wip);
  } else if (isHotfix) {
    labels.push(hotfix);
  } else if (isRelease) {
    labels.push(release);
  } else if (isFeature && targetsFeature) {
    labels.push(partial);
  } else if (isFeature) {
    labels.push(feature);
  }
  return labels.filter(l => l !== '');
}

async function getPullRequest(
  client: github.GitHub,
  prNumber: number
): Promise<PullRequest> {
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
      number: prNumber
    }
  );

  return { ...repository.pullRequest };
}

run();

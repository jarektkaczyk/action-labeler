"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = core.getInput("repo-token", { required: true });
            const prPayload = github.context.payload.pull_request;
            if (!prPayload) {
                throw Error("Could not get pull request number from context, exiting");
            }
            yield addLabels(new github.GitHub(token), prPayload);
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
function addLabels(client, prPayload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { repository } = yield client.graphql(`
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
      `, {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            number: prPayload.number
        });
        const PR = Object.assign({}, repository.pullRequest);
        const isWip = PR.title.match(/\bwip\b/i);
        const isHotfix = PR.headRefName.match(/^hotfix/);
        const isFeature = PR.headRefName.match(/^feature/);
        const isRelease = PR.headRefName.match(/^release/);
        const targetsFeature = PR.baseRefName.match(/^feature/);
        const labels = [];
        if (isWip) {
            labels.push('dnm');
        }
        else if (isHotfix) {
            labels.push('hotfix');
        }
        else if (isRelease) {
            labels.push('release');
        }
        else if (isFeature && targetsFeature) {
            labels.push('partial');
        }
        else if (isFeature) {
            labels.push('feature');
        }
        if (labels.length > 0) {
            yield client.issues.addLabels({
                // ...github.context.repo,
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: PR.number,
                labels: labels
            });
        }
    });
}
run();

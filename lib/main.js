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
            yield addLabels(new github.GitHub(token));
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
function addLabels(client) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(github.context.payload.issue);
        const prPayload = github.context.payload.pull_request;
        if (!prPayload) {
            throw Error("Could not get pull request number from context, exiting");
        }
        const { owner, repo } = github.context.repo;
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
            owner: owner,
            repo: repo,
            number: prPayload.number
        });
        const PR = Object.assign({}, repository.pullRequest);
        console.log(PR);
        //   await client.issues.addLabels()
    });
}
run();

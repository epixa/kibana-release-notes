'use strict';

/*
Generates an asciidoc formatted list of PRs for a given release
*/

// To protect your github rate limits, we only need to query as far back as
// the earliest PR in this particular release.
// Technically this retrieves any issues with activity since that date, but
// it's the closest we have. Don't worry, they'll get filtered out from the
// output.
// YYYY-MM-DD
const DAY_BEFORE_EARLIEST_PR = '2016-08-07';
const CURRENT_RELEASE_LABEL = 'v5.2.0';
const PREVIOUS_RELEASE_LABELS = 'v5.0.0 v5.0.1 v5.0.2 v5.1.1 v5.1.2'.split(' ');
const TOKEN = require('./.token.json').token;

const github = require('octonode');

const client = github.client(TOKEN);

const ghrepo = client.repo('elastic/kibana');

const issues = {};
let prpage = 1;
let page = 1;

function loadIssues() {
  ghrepo.issues({
    state: 'closed',
    page,
    per_page: 100,
    sort: 'created',
    direction: 'desc',
    since: `${DAY_BEFORE_EARLIEST_PR}T00:00:01Z`
  }, function (err, data, headers) {
    if (err) {
      console.error(err);
      throw err;
    }
    if (data.length === 0) {
      logPrs();
      return;
    }
    data.forEach(function (issue) {
      const isPullRequest = !!issue.pull_request;
      if (!isPullRequest) {
        return;
      }

      issues[issue.number] = issue.labels.map(label => label.name);
    });

    page++;
    loadIssues();
  });
}

function logPrs() {
  if (Object.keys(issues).length === 0) {
    return;
  }
  ghrepo.prs({
    state: 'all', // get all just in case, irrelevant PRs will be filtered out
    page: prpage,
    per_page: 100,
    sort: 'created',
    direction: 'desc'
  }, function (err, data, headers) {
    if (err) {
      console.error(err);
      throw err;
    }
    data.forEach(function (pr) {
      if (!(pr.number in issues)) {
        return;
      }

      const url = pr.html_url;
      const title = pr.title;
      const number = pr.number;
      const mergeDate = pr.merged_at;

      const labels = issues[number];
      delete issues[number]; // must happen before pull request filtering begins

      if (!mergeDate) {
        return;
      }

      if (pr.base.ref !== 'master') {
        return;
      }

      if (labels.includes('backport')) {
        return;
      }
      if (labels.includes('docs')) {
        return;
      }
      if (labels.includes('reverted')) {
        return;
      }
      if (!labels.includes(CURRENT_RELEASE_LABEL)) {
        return;
      }
      if (PREVIOUS_RELEASE_LABELS.some(label => labels.includes(label))) {
        return;
      }
      /*
      // for finding prs without appropriate version labels to manually verify
      if (labels.filter(l => l[0] === 'v').length > 0) { // ignore if we have any other version labels
        return;
      }
      console.log(`#${number} ${mergeDate} ${title}`);
      */

      console.log(`* ${title} {pull}${number}[#${number}]`);
    });

    prpage++;
    logPrs();
  });
}

loadIssues();

'use strict';

const TOKEN = require('./.token.json').token;

const github = require('octonode');

const client = github.client(TOKEN);

client.limit((err, data) => {
  if (err) {
    console.error(err);
    throw err;
  }
  console.log(data);
});

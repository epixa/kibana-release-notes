# Kibana release note utilities

### Setup

You will need a personal access token from github with read access to the
Kibana repo.

```sh
echo '{"token":"YOUR_GITHUB_TOKEN"}' > .token.json
npm install
```

### Generate a list of PRs

Update prs.js with the appropriate version info.

```sh
node prs
```

### Check github limits
```sh
node limit
```

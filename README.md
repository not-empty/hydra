[![Latest Version](https://img.shields.io/github/v/release/not-empty/hydra.svg?style=flat-square)](https://github.com/not-empty/hydra/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## Instalation

### Docker

Requirements

- [Docker](https://docs.docker.com/)

Command

```sh
docker compose up -d
```

### Node

Requirements

- [Node v20.x](https://nodejs.org/en/download/package-manager)
- [Redis](https://redis.io/)

Configure Environments

```
REDIS_HOST=localhost
REDIS_PORT=6379
```

Install dependencies
```sh
npm install
```

Build
```sh
npm run build
```

Start hydra server
```sh
npm start
```
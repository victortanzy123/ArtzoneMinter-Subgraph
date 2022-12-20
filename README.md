# Niftyzone Marketplace & Minter Subgraph

## Setting up local development environment

### Prerequisites

Make sure you have [docker](https://docs.docker.com/engine/install) installed in your system.

In the root directory run the following command

```bash
docker compose up -d
```

To prepare the workspace for a given network run,

```bash
yarn prepare:<network>
```

To deploy locally

```bash
yarn create-local
yarn deploy-local
```

Go to [http://localhost:4000](http://localhost:4000) to view the graphql playground

## Deploy

```bash
export NIFTYZONE_SUBGRAPH_ACCESS_KEY=<your-access-key>
yarn deploy:<network>
```
# ArtzoneMinter-Subgraph

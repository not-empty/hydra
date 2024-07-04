# Hydra Async Pool
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

![Architecture sample](https://github.com/not-empty/hydra/blob/main/hydra.png)

**Hydra Async Pool** is an open-source project designed to manage and limit asynchronous concurrency in high availability and high resource-demanding environments. This tool is essential for applications that need to restrict the number of simultaneous executions of certain tasks due to rate limits or resource constraints.

## Introduction

In high-demand environments, managing the execution of asynchronous concurrent tasks is crucial and hard. Whether dealing with services that impose rate limits, databases with connection limits, or systems with constrained resources, you need a solution that can handle asynchronous concurrency gracefully. **Hydra Async Pool** provides a robust and flexible way to manage and limit the number of concurrent asynchronous jobs, ensuring your system remains stable and performs optimally.

## Features

- **Concurrency Limiting**: Define the maximum number of asynchronous concurrent jobs to prevent brake rate limits or resource exhaustion.
- **Redis Integration**: Uses Redis for efficient and reliable job queue management.
- **Job States Management**: Track and manage job states, including pending, executing, and finished jobs.
- **Real-time Updates**: Subscribe to job updates for real-time monitoring and control.
- **Scalability**: Designed to scale with your application's needs, making it suitable for both small and large deployments.

## Configuration

Copy the .env.example file to .env file and change your parameters

- `POOL_INTERVAL`: The interval (in milliseconds) at which the pool checks for new free slots to run new tasks.
- `POOL_MAX_CONCURRENT`: The maximum number of concurrent jobs allowed.
- `POOL_PREFIX`: A domain name for Hydra, you can run multiples Hydras on different domains (even in the same Redis) if you want to :).
- `REDIS_HOST`: Your redis host.
- `REDIS_PORT`: Your redis port.

## Running on docker

After clonning the repository, run **Hydra Async Pool** via docker:

```sh
docker-compose up
```

Your Hydra will be started and will be listening for new jobs and finished jobs, maintaining the concurrency at the maximum level you have set.

## Publish/Finish

To enable the job publishing and finishing workflow, you need to install the [Hydra Publisher library](https://github.com/not-empty/hydra-publisher). This library should be integrated into the projects that handle the logic for publishing new jobs as well as the workers that execute these jobs.

## Integration
Job Publishers: Projects that create and submit new jobs need to use the Hydra Publisher to send job requests to the manager. This ensures that all new jobs are properly registered and managed within the job pool.

Worker Nodes: Projects or services that execute jobs also need to use the Hydra Publisher. These worker nodes will update the job statuses upon completion, sending the finished job information back to the manager.

The Hydra Publisher handles the communication between job publishers, worker nodes, and the job manager. By publishing new jobs and reporting finished jobs, the manager can effectively orchestrate job pooling and ensure that concurrency limits are respected.

## Publishing
```javascript
import { HydraPublisher } from 'hydra-publisher';

const publisher = new HydraPublisher({ redisOptions: { url: 'redis://localhost:6379' } });

const jobId = await publisher.addJob({ task: 'exampleTask' });
console.log(`Job added with ID: ${jobId}`);
```

## Finishing
```javascript
import { HydraPublisher } from 'hydra-publisher';

const publisher = new HydraPublisher({ redisOptions: { url: 'redis://localhost:6379' } });

// After completing the job
await publisher.finishJob(jobId);
console.log(`Job ${jobId} finished`);
```
By following this setup, the Hydra Async Pool will be able to orchestrate the job pooling, manage concurrency, and ensure efficient job execution across your system.

**Not Empty Foundation - Free codes, full minds**
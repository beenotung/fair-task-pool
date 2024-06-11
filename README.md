# fair-task-pool

Fairly schedule async tasks and prevent any since user/subject from monopolizing the system resources.

[![npm Package Version](https://img.shields.io/npm/v/fair-task-pool)](https://www.npmjs.com/package/fair-task-pool)

## Description

The "fair-task-pool" library provides a robust and efficient mechanism for managing task queues on a per-key basis. This library is especially useful in scenarios where you need to maintain separate queues for different users or tasks, ensuring fair resource allocation and preventing any single queue from monopolizing the task processing system. Each key (which can be a string or number) gets its own queue, and tasks are processed asynchronously in the order they are received.

## Features

- **Per-Key Queues**: Manage separate task queues for each unique key.
- **Configurable Capacity**: Set a maximum number of pending tasks per queue, with an option for unlimited capacity.
- **In-memory implementation**: Lightweight and not requiring external services.
- **Automatic Queue Flushing**: Optionally, automatically delete queues when they become empty to free up resources.
- **Error Handling**: The library ensures that task processing does not break due to task errors, and throw a specific error (`TaskQueueFullError`) when a task cannot be added to a full queue.

This library is ideal for applications requiring fair and efficient task management across multiple entities or resources.

## Installation

```bash
npm install fair-task-pool
```

## Usage Example

Some of the details are omitted for simplicity, complete example see: [example/app.ts](./example/app.ts)

```typescript
import { FairTaskPool } from 'fair-task-pool'
import { Request, Response, NextFunction } from 'express'

let MaxQueueSize = 20

let fairTaskPool = new FairTaskPool({
  capacity: MaxQueueSize,
  flushQueueWhenEmpty: true,
})

function createThread(req: Request, res: Response, next: NextFunction) {
  let { user_id } = getJWTPayload(req)
  res.setHeader('X-RateLimit-Limit', MaxQueueSize)
  res.setHeader(
    'X-RateLimit-Remaining',
    MaxQueueSize - fairTaskPool.getPendingTaskCount(user_id),
  )
  fairTaskPool.enqueue(user_id, async () => {
    try {
      let input = createThreadParser.parse(req.body)
      let result = await service.createThread({
        user_id,
        content: input.content,
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  })
}

function getThread(req: Request, res: Response, next: NextFunction) {
  let queue_key: number | string
  try {
    let payload = getJWTPayload(req)
    queue_key = payload.user_id
  } catch {
    // all non authenticated users share the same quota
    queue_key = 'guest'
  }
  res.setHeader('X-RateLimit-Limit', MaxQueueSize)
  res.setHeader(
    'X-RateLimit-Remaining',
    MaxQueueSize - fairTaskPool.getPendingTaskCount(queue_key),
  )
  fairTaskPool.enqueue(queue_key, async () => {
    try {
      let input = getThreadParser.parse(req.params)
      let result = await service.getThread({ id: input.id })
      res.json(result)
    } catch (error) {
      next(error)
    }
  })
}
```

## Typescript Signature

Types for main class `FairTaskPool`:

```typescript
/** @description can be used for per-user task queue */
export class FairTaskPool {
  constructor(options?: {
    /**
     * @description max number of pending tasks per-key
     * @default unlimited if undefined
     * */
    capacity?: number

    /** @default false */
    flushQueueWhenEmpty?: boolean
  })

  /**
   * @description dispatch the task to corresponding TaskQueue partitioned by the `key`
   * @throws TaskQueueFullError when exceed
   * */
  enqueue<T>(key: Key, task: Task<T>): Promise<T>

  getPendingTaskCount(key: Key): number

  getQueueSize(): number
}

type Key = string | number

/** @description the task should not throw errors. */
export type Task<T> = () => T | Promise<T>

export class TaskQueueFullError extends Error {
  capacity: number
}
```

Types for helper class `TaskQueue`:

```typescript
export interface TaskQueue {
  pendingTaskCount: number
  onEmpty?: () => void
  /** @throws TaskQueueFullError when exceed */
  enqueue<T>(task: Task<T>): Promise<T>
}

export class UnlimitedTaskQueue implements TaskQueue {
  constructor(options: { onEmpty?: () => void })
}

export class LimitedTaskQueue extends UnlimitedTaskQueue implements TaskQueue {
  capacity: number
  constructor(options: { onEmpty?: () => void; capacity: number })
}
```

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others

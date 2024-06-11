type Key = string | number

/** @description can be used for per-user task queue */
export class FairTaskPool {
  private queues = new Map<Key, TaskQueue>()

  constructor(
    public options: {
      /**
       * @description max number of pending tasks per-key
       * @default unlimited if undefined
       * */
      capacity?: number

      /** @default false */
      flushQueueWhenEmpty?: boolean
    } = {},
  ) {}

  /**
   * @description dispatch the task to corresponding TaskQueue partitioned by the `key`
   * @throws TaskQueueFullError when exceed
   * */
  enqueue<T>(key: Key, task: Task<T>): Promise<T> {
    let queue = this.getQueue(key)
    return queue.enqueue(task)
  }

  getPendingTaskCount(key: Key): number {
    let queue = this.queues.get(key)
    return queue ? queue.pendingTaskCount : 0
  }

  getQueueSize() {
    return this.queues.size
  }

  private getQueue(key: Key): TaskQueue {
    let queue = this.queues.get(key)
    if (!queue) {
      let onEmpty = this.options.flushQueueWhenEmpty
        ? () => {
            this.queues.delete(key)
          }
        : undefined
      let capacity = this.options.capacity
      queue = capacity
        ? new LimitedTaskQueue({ onEmpty, capacity })
        : new UnlimitedTaskQueue({ onEmpty })
      this.queues.set(key, queue)
    }
    return queue
  }
}

/** @description the task is executed with try-catch. */
export type Task<T> = () => T | Promise<T>

export interface TaskQueue {
  pendingTaskCount: number
  onEmpty?: () => void
  /** @throws TaskQueueFullError when exceed */
  enqueue<T>(task: Task<T>): Promise<T>
}

export class UnlimitedTaskQueue implements TaskQueue {
  queue: Task<void>[] = []

  running = false

  onEmpty?: () => void

  constructor(options?: { onEmpty?: () => void }) {
    this.onEmpty = options?.onEmpty
  }

  get pendingTaskCount(): number {
    return this.queue.length
  }

  enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task())
        } catch (error) {
          reject(error)
        }
      })
      this.tick()
    })
  }

  async tick() {
    if (this.running) return
    this.running = true
    while (this.queue.length > 0) {
      let task = this.queue.shift()!
      await task()
    }
    this.running = false
    if (this.onEmpty) {
      this.onEmpty()
    }
  }
}

export class LimitedTaskQueue extends UnlimitedTaskQueue implements TaskQueue {
  capacity: number

  constructor(options: { onEmpty?: () => void; capacity: number }) {
    super(options)
    this.capacity = options.capacity
  }

  /** @throws TaskQueueFullError when exceed */
  enqueue<T>(task: Task<T>): Promise<T> {
    if (this.queue.length >= this.capacity) {
      throw new TaskQueueFullError(this.capacity)
    }
    return super.enqueue(task)
  }
}

export class TaskQueueFullError extends Error {
  statusCode = 429 as const
  constructor(public capacity: number) {
    super('exceed task queue capacity of ' + capacity)
  }
}

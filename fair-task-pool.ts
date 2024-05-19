type Key = string | number

/** @description can be used for per-user task queue */
export class FairTaskPool {
  queues = new Map<Key, TaskQueue>()

  constructor(
    public options: {
      /** @description max number of pending tasks per-key */
      /** @default unlimited if undefined */
      capacity?: number

      /** @default false */
      flushQueueWhenEmpty?: boolean
    } = {},
  ) {}

  enqueue(key: Key, task: Task): void {
    let queue = this.getQueue(key)
    queue.enqueue(task)
  }

  getQueue(key: Key): TaskQueue {
    let queue = this.queues.get(key)
    if (!queue) {
      let onEmpty = this.options.flushQueueWhenEmpty
        ? () => {
            this.queues.delete(key)
          }
        : null
      let capacity = this.options.capacity
      queue = capacity
        ? new LimitedTaskQueue({ onEmpty, capacity })
        : new UnlimitedTaskQueue({ onEmpty })
      this.queues.set(key, queue)
    }
    return queue
  }
}

/** @description the task should not throw errors. */
type Task = () => void | Promise<void>

interface TaskQueue {
  onEmpty: null | (() => void)
  enqueue(task: Task): void
}

class UnlimitedTaskQueue implements TaskQueue {
  queue: Task[] = []

  running = false

  onEmpty: null | (() => void)

  constructor(options: { onEmpty: null | (() => void) }) {
    this.onEmpty = options.onEmpty
  }

  enqueue(task: Task) {
    this.queue.push(task)
    this.tick()
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

class LimitedTaskQueue extends UnlimitedTaskQueue implements TaskQueue {
  capacity: number

  constructor(options: { onEmpty: null | (() => void); capacity: number }) {
    super(options)
    this.capacity = options.capacity
  }

  enqueue(task: Task) {
    if (this.queue.length >= this.capacity) {
      throw new TaskQueueFullError(this.capacity)
    }
    super.enqueue(task)
  }
}

export class TaskQueueFullError extends Error {
  constructor(public capacity: number) {
    super('exceed capacity of ' + capacity)
  }
}
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

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others

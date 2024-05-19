import { expect } from 'chai'
import { FairTaskPool, TaskQueueFullError } from './fair-task-pool'

function dummyTask() {
  // dummy function
}

function testCapacity(key: number) {
  let capacity = 3
  let taskQueue = new FairTaskPool({ capacity })
  for (let i = 1; i <= capacity + 1; i++) {
    taskQueue.enqueue(key, dummyTask)
  }
  expect(() => taskQueue.enqueue(key, dummyTask)).to.throws(TaskQueueFullError)
}

context('FairTaskPool TestSuit', () => {
  context('single user tests', () => {
    let dummyKey = 1
    it('should enqueue at most "capacity + 1" tasks in once', () => {
      testCapacity(dummyKey)
    })
    it('should enqueue more tasks when previous tasks were finished', done => {
      let capacity = 3
      let taskQueue = new FairTaskPool({ capacity })
      let n = 10
      function tick(i: number) {
        if (i <= n) {
          taskQueue.enqueue(dummyKey, dummyTask)
          setTimeout(() => tick(i + 1))
        } else {
          setTimeout(done)
        }
      }
      tick(1)
    })
  })
  context('multi-user tests', () => {
    it('should isolate limit for each key', () => {
      for (let key = 1; key <= 10; key++) {
        testCapacity(key)
      }
    })
  })
  context('flushQueueWhenEmpty option', () => {
    let dummyKey = 1
    let capacity = 3
    function dummyTask() {
      return new Promise<void>((resolve, reject) => {
        setTimeout(resolve)
      })
    }
    it('should not flush queues by default', done => {
      let taskQueue = new FairTaskPool({ capacity })
      taskQueue.enqueue(dummyKey, dummyTask)
      setTimeout(() => {
        expect(taskQueue.queues.size).to.equals(1)
        done()
      })
    })
    it('should flush queues when specified', done => {
      let taskQueue = new FairTaskPool({ capacity, flushQueueWhenEmpty: true })
      taskQueue.enqueue(dummyKey, dummyTask)
      expect(taskQueue.queues.size).to.equals(1)
      setTimeout(() => {
        expect(taskQueue.queues.size).to.equals(0)
        done()
      })
    })
  })
})

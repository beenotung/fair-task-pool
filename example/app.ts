import { id, object, string } from 'cast.ts'
import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express'
import { print } from 'listening-on'
import { HttpError } from './http.error'
import { encodeJWT, getJWTPayload } from './jwt'
import { FairTaskPool } from '../fair-task-pool'

// set small number of pending requests for demo
let MaxQueueSize = 2

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

let app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

type User = {
  id: number
  username: string
  password: string
}

type Thread = {
  id: number
  user_id: number
  content: string
}

namespace service {
  let users: User[] = []
  let threads: Thread[] = []

  export function signup(input: { username: string; password: string }) {
    if (users.find(user => user.username == input.username)) {
      throw new HttpError(409, 'username already in use')
    }
    let id = users.length + 1
    users.push({ id, username: input.username, password: input.password })
    return { id }
  }

  export function login(input: { username: string; password: string }) {
    let user = users.find(
      user =>
        user.username == input.username && user.password == input.password,
    )
    if (!user) {
      throw new HttpError(403, 'wrong username or password')
    }
    let token = encodeJWT({ user_id: user.id, issued_at: Date.now() })
    return { token }
  }

  export async function createThread(input: {
    user_id: number
    content: string
  }) {
    await sleep(2000) // simulate some delay for database operations
    let id = threads.length + 1
    threads.push({ id, user_id: input.user_id, content: input.content })
    return { id }
  }

  export async function getThread(input: { id: number }) {
    await sleep(2000) // simulate some delay for database operations
    let thread = threads.find(thread => thread.id == input.id)
    if (!thread) {
      throw new HttpError(404, 'thread not found')
    }
    return { thread }
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

let authParser = object({ username: string(), password: string() })

app.post('/signup', (req, res) => {
  let input = authParser.parse(req.body)
  let result = service.signup(input)
  res.json(result)
})

app.post('/login', (req, res) => {
  let input = authParser.parse(req.body)
  let result = service.login(input)
  res.json(result)
})

let createThreadParser = object({ content: string() })

app.post('/threads', createThread)

let getThreadParser = object({ id: id() })

app.get('/threads/:id', getThread)

app.use((req, res, next) =>
  next(
    new HttpError(
      404,
      `route not found, method: ${req.method}, url: ${req.url}`,
    ),
  ),
)

let errorHandler: ErrorRequestHandler = (err: HttpError, req, res, next) => {
  if (!err.statusCode) console.error(err)
  res.status(err.statusCode || 500)
  let error = String(err).replace(/^(\w*)Error: /, '')
  if (req.headers.accept?.includes('application/json')) {
    res.json({ error })
  } else {
    res.end(error)
  }
}
app.use(errorHandler)

let port = 8100
app.listen(port, () => {
  print(port)
})

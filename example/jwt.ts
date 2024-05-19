import { Request } from 'express'
import { Bearer } from 'permit'
import { HttpError } from './http.error'
import jwt from 'jwt-simple'
import { env } from './env'
import { ParseResult, id, number, object } from 'cast.ts'
import { DAY } from '@beenotung/tslib/time'

const permit = new Bearer({
  query: 'access_token',
})

let jwtParser = object({
  user_id: id(),
  issued_at: number(),
})
export type JWTPayload = ParseResult<typeof jwtParser>

export function getJWTPayload(req: Request): JWTPayload {
  let token: string
  try {
    token = permit.check(req)
  } catch (error) {
    throw new HttpError(401, 'invalid bearer authorization header')
  }
  if (!token) {
    throw new HttpError(401, 'missing jwt token')
  }

  let jwyPayload: JWTPayload
  try {
    jwyPayload = jwtParser.parse(jwt.decode(token, env.JWT_SECRET))
  } catch (error) {
    throw new HttpError(401, 'invalid jwt token: ' + error)
  }

  if (jwyPayload.issued_at + 30 * DAY <= Date.now()) {
    throw new HttpError(401, 'expired jwt token')
  }

  return jwyPayload
}

export function encodeJWT(payload: JWTPayload): string {
  let token: string = jwt.encode(payload, env.JWT_SECRET)
  return token
}

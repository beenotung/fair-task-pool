import { config } from 'dotenv'
import populateEnv from 'populate-env'

config()

export let env = {
  JWT_SECRET: '',
}

populateEnv(env, { mode: 'halt' })

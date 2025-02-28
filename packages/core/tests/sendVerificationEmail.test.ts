import faker from '@faker-js/faker'
import { interpret } from 'xstate'
import { waitFor } from 'xstate/lib/waitFor'
import { AuthClient } from '../src/client'
import { INVALID_EMAIL_ERROR } from '../src/errors'
import { createSendVerificationEmailMachine } from '../src/machines'
import { Typegen0 } from '../src/machines/send-verification-email.typegen'
import { BASE_URL } from './helpers/config'
import {
  sendVerificationEmailInternalErrorHandler,
  sendVerificationEmailNetworkErrorHandler,
  sendVerificationEmailUserNotFoundHandler
} from './helpers/handlers'
import server from './helpers/server'
import CustomClientStorage from './helpers/storage'
import { GeneralSendVerificationEmailState } from './helpers/types'

type SendVerificationEmailState = GeneralSendVerificationEmailState<Typegen0>

const customStorage = new CustomClientStorage(new Map())

const sendVerificationEmailMachine = createSendVerificationEmailMachine(
  new AuthClient({
    backendUrl: BASE_URL,
    clientUrl: 'http://localhost:3000'
  })
)

const sendVerificationEmailService = interpret(sendVerificationEmailMachine)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

beforeEach(() => {
  sendVerificationEmailService.start()
})

afterEach(() => {
  sendVerificationEmailService.stop()
  customStorage.clear()
  server.resetHandlers()
})

test(`should fail if there is a network error`, async () => {
  server.use(sendVerificationEmailNetworkErrorHandler)

  sendVerificationEmailService.send({
    type: 'REQUEST',
    email: faker.internet.email()
  })

  const state: SendVerificationEmailState = await waitFor(
    sendVerificationEmailService,
    (state: SendVerificationEmailState) => state.matches({ idle: 'error' })
  )

  expect(state.context.error).toMatchInlineSnapshot(`
    {
      "error": "OK",
      "message": "Network Error",
      "status": 200,
    }
  `)
})

test(`should fail if server returns an error`, async () => {
  server.use(sendVerificationEmailInternalErrorHandler)

  sendVerificationEmailService.send({
    type: 'REQUEST',
    email: faker.internet.email()
  })

  const state: SendVerificationEmailState = await waitFor(
    sendVerificationEmailService,
    (state: SendVerificationEmailState) => state.matches({ idle: 'error' })
  )

  expect(state.context.error).toMatchInlineSnapshot(`
    {
      "error": "internal-error",
      "message": "Internal error",
      "status": 500,
    }
  `)
})

test(`should fail if email is invalid`, async () => {
  sendVerificationEmailService.send({
    type: 'REQUEST',
    email: faker.internet.userName()
  })

  const state: SendVerificationEmailState = await waitFor(
    sendVerificationEmailService,
    (state: SendVerificationEmailState) => state.matches({ idle: 'error' })
  )

  expect(state.context.error).toMatchObject(INVALID_EMAIL_ERROR)
})

test(`should fail if user is not found`, async () => {
  server.use(sendVerificationEmailUserNotFoundHandler)

  sendVerificationEmailService.send({
    type: 'REQUEST',
    email: faker.internet.email()
  })

  const state: SendVerificationEmailState = await waitFor(
    sendVerificationEmailService,
    (state: SendVerificationEmailState) => state.matches({ idle: 'error' })
  )

  expect(state.context.error).toMatchInlineSnapshot(`
    {
      "error": "user-not-found",
      "message": "No user found",
      "status": 400,
    }
  `)
})

test(`should succeed if email is valid`, async () => {
  sendVerificationEmailService.send({ type: 'REQUEST', email: faker.internet.email() })

  const state: SendVerificationEmailState = await waitFor(
    sendVerificationEmailService,
    (state: SendVerificationEmailState) => state.matches({ idle: 'success' })
  )

  expect(state.context.error).toBeNull()
})

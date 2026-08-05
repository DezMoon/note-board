import { mount } from 'cypress-lit'
import 'cypress-real-events'
import { worker } from '../../src/mocks/browser'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
      startMsw(): Chainable<void>
    }
  }
}

Cypress.Commands.add('mount', mount)

Cypress.Commands.add('startMsw', () => {
  return cy.wrap(
    worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    }),
  )
})

import { defineConfig } from 'cypress'

// `devServerPublicPathRoute` is not part of Cypress 15's published TypeScript types, but Cypress reads it
// at runtime. We need it set to '' so the component-test dev server is served from the origin root and the
// MSW service worker can be registered at scope `/` (cy.startMsw).
const componentConfig = {
  supportFile: 'cypress/support/component.ts',
  indexHtmlFile: 'cypress/support/component-index.html',
  specPattern: ['cypress/component/**/*.cy.ts', 'src/**/*.cy.ts'],
  devServerPublicPathRoute: '',
  devServer: {
    bundler: 'vite' as const,
    framework: 'react' as const,
  },
}

export default defineConfig({
  defaultCommandTimeout: 10000,
  includeShadowDom: true,
  video: false,
  component: componentConfig,
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
  },
})

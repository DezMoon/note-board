class ScaffoldSmoke extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = '<p data-testid="msg">scaffold ok</p>'
  }
}

if (!customElements.get('scaffold-smoke')) {
  customElements.define('scaffold-smoke', ScaffoldSmoke)
}

describe('scaffold smoke test', () => {
  it('mounts a custom element via cy.mount', () => {
    cy.mount('<scaffold-smoke></scaffold-smoke>')
    cy.get('[data-testid="msg"]').should('have.text', 'scaffold ok')
  })
})

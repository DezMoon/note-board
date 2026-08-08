import '../../src/note-board/note-board'
import '../../src/note-board/note-card'

describe('<note-board> component', () => {
  it('adds a note, edits it with TipTap, and saves sanitized HTML', () => {
    cy.startMsw()
    cy.mount('<note-board></note-board>')

    // wait for initial notes to load
    cy.get('note-board').shadow().find('.note-list').should('exist')
    cy.get('note-board').shadow().find('note-card').should('have.length.gte', 1)

    // Click Add note
    cy.get('note-board').shadow().find('button').contains('Add note').click()
    // Wait for a new note-card to appear (initial seed has 3)
    cy.get('note-board')
      .shadow()
      .find('note-card')
      .should(($cards) => {
        expect($cards.length).to.be.gte(4)
      })

    // Find the last note-card (the newly created one)
    cy.get('note-board')
      .shadow()
      .find('note-card')
      .last()
      .shadow()
      .find('button')
      .contains('Edit')
      .click()

    // Wait for TipTap's editable ProseMirror to appear, then type into it
    cy.get('note-board')
      .shadow()
      .find('note-card')
      .last()
      .shadow()
      .find('.ProseMirror')
      .should('exist')
      .click()
      .clear()
      .type('Hello<script>alert(1)</script><img src="x" onerror="alert(2)">', { delay: 10 })

    // Click Save inside the card
    cy.get('note-board').shadow().find('note-card').last().shadow().find('button').contains('Save').click()

    // After save, the card should render sanitized HTML and not inject script/img elements
    cy.get('note-board')
      .shadow()
      .find('note-card')
      .last()
      .shadow()
      .find('.body')
      .should('contain.text', 'Hello')
      .find('script')
      .should('not.exist')

    cy.get('note-board')
      .shadow()
      .find('note-card')
      .last()
      .shadow()
      .find('.body')
      .find('img')
      .should('not.exist')
  })
})

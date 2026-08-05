import './styles.css'

if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/browser')

  await worker.start({
    onUnhandledRequest: 'bypass',
  })
}

await import('./note-board/note-board')

const app = document.querySelector<HTMLDivElement>('#app')

if (app === null) {
  throw new Error('Application root element was not found.')
}

app.innerHTML = '<note-board></note-board>'
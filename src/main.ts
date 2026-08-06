
import './styles.css';

async function init() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  
  await import('./note-board/note-board');
}

init();
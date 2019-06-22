import reduct from 'reduct'
import { App } from './services/App'

const app = reduct()(App)
app
  .start()
  .catch(e => {
    console.error('fatal:', e)
    process.exit(1)
  })

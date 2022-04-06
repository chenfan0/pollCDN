const Koa = require('koa')

const static = require('koa-static')

const app = new Koa()

// cdn
app.use(static('./build/'))

app.listen(8080, () => {
  console.log('server run in 8080');
})


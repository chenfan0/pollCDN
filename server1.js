const Koa = require('koa')

const static = require('koa-static')

const app = new Koa()

// 无cdn
app.use(static('./dist'))

app.listen(8080, () => {
  console.log('server run in 8080');
})


const http = require('http')
const PORT = 3000
const DEFAULT_HEADER = { 'Content-Type': 'application/json' }
const HeroFactory = require('./factories/heroFactory')
const heroService = HeroFactory.generateInstance()
const Hero = require('./entities/Hero')

const routes = {
  '/heroes:get': async (req, res) => {
    // await Promise.reject('Erro. /heroes:get')
    const { id } = req.queryString
    const hero = await heroService.find(id)
    res.write(JSON.stringify({ results: hero }))
    return res.end()
  },
  '/heroes:post': async (req, res) => {
    // await Promise.reject('Erro. /heroes:post')
    for await (const data of req) {
      const item = JSON.parse(data)
      const hero = new Hero(item)
      const { valid, error } = hero.isValid()
      if (!valid) {
        res.writeHead(400, DEFAULT_HEADER)
        res.write(JSON.stringify({ error: error.join(', ') }))
        return res.end()
      }
      const id = await heroService.create(hero)
      res.writeHead(201, DEFAULT_HEADER)
      res.write(JSON.stringify({ success: 'User successfully created.', id }))

      //Só retornamos aqui (dentro do for), pois sabemos que só possuimos um objeto body por requisição
      //se fosse um upload de arquivo, que sobe sob demanda
      //poderia entrar mais vezes em um mesmo evento, sendo necessário remover o return.
      return res.end()
    }
  },
  default: (req, res) => {
    res.write('Hello World! 404.')
    res.end()
  }
}

const handleError = res => {
  return error => {
    console.error('Deu ruim.')
    res.writeHead(500, DEFAULT_HEADER)
    res.write(JSON.stringify({ error: 'Internal server error.' }))
    res.end()
  }
}

const handler = (req, res) => {
  const { url, method } = req
  const [, route, id] = url.split('/')
  req.queryString = { id: isNaN(id) ? id : Number(id), route }

  const key = `/${route}:${method.toLowerCase()}`

  res.writeHead(200, DEFAULT_HEADER)
  const chosen = routes[key] || routes.default
  return chosen(req, res).catch(handleError(res))
}

http
  .createServer(handler)
  .listen(PORT, () => {
    console.log('Sever runing  at', `http://localhost:${PORT}`)
  })
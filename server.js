var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var path = request.url
  var query = ''
  if (path.indexOf('?') >= 0) {
    query = path.substring(path.indexOf('?'))
  }
  var pathNoQuery = parsedUrl.pathname
  var queryObject = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/




  console.log('得到 HTTP 路径\n' + path)
  if (path === '/index.html') {
    let string = fs.readFileSync('./index.html', 'utf8')
    let cookies = request.headers.cookie
    let foundCookie = false
    try{
      cookies = cookies.split()
    }catch(err){
    }
    let hash = []
    try{
      cookies.forEach((cookie) => {
        let parts = cookie.split('=')
        let key = parts[0]
        let value = parts[1]
        hash[key] = value
      })
      let users = fs.readFileSync('./db', 'utf8')
      users = JSON.parse(users)
      for (let i = 0; i < users.length; i++) {
        if (users[i].email === hash.user_email) {
          foundCookie = true
          break;
        }
      }
    }
    catch(err){

    }
    
    if (foundCookie) {
      string = string.replace('__replace__', hash.user_email)
    } else {
      string = string.replace('__replace__', "未登录")
    }
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/style.css') {
    let string = fs.readFileSync('./style.css', 'utf8')
    response.setHeader('Content-Type', 'text/css;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_up.html' && method === 'GET') {
    let string = fs.readFileSync('./sign_up.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_up.html' && method === 'POST') {
    readBody(request).then((body) => {
      var hash = {}
      let strings = body.split('&')
      strings.forEach((string) => {
        let parts = string.split('=')
        let key = parts[0]
        let value = parts[1]
        hash[key] = decodeURIComponent(value)
      })
      let {
        email,
        password,
        password_confirmation
      } = hash
      if (email.indexOf('@') === -1) {
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.statusCode = 400
        response.write(`{
          "errors":{
            "email":"invalid"
          }
        }`)
      } else if (password !== password_confirmation) {
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.statusCode = 400
        response.write(`{
          "errors":{
            "password":"difference"
          }
        }`)
      } else {
        let users = fs.readFileSync('./db', 'utf8')
        users = JSON.parse(users)
        let inUser = false
        for (let i = 0; i < users.length; i++) {
          let user = users[i]
          if (user.email === email) {
            inUser = true
            break;
          }
        }
        if (inUser) {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json;charset=utf-8')
          response.write(`{
            "errors":{
              "email":"inUser"
            }
          }`)
        } else {
          response.statusCode = 200
          users.push({
            email: email,
            password: password
          })
          let userString = JSON.stringify(users)
          fs.writeFileSync('./db', userString)
        }
      }
      response.end()
    })
  } else if (path === '/sign_in.html' && method === 'GET') {
    let string = fs.readFileSync('./sign_in.html', 'utf8')
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_in.html' && method === 'POST') {
    readBody(request).then((body) => {
      let users = fs.readFileSync('./db', 'utf8')
      users = JSON.parse(users)
      var hash = {}
      let strings = body.split('&')
      strings.forEach((string) => {
        let parts = string.split('=')
        let key = parts[0]
        let value = parts[1]
        hash[key] = decodeURIComponent(value)
      })
      let {
        email,
        password
      } = hash

      if (email.indexOf('@') === -1) {
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.statusCode = 400
        response.write(`{
          "errors":{
            "email":"invalid"
          }
        }`)
      }
      let found = false
      for (let i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].password === password) {
          found = true
          var currentUser = users[i].email
        }
      }
      if (found) {
        response.setHeader('Set-Cookie', `user_email=${currentUser}`)
        response.statusCode = 200
      } else {
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.statusCode = 400
        response.write(`{
          "errors":{
            "email":"error"
          }
        }`)
      }
      response.end()
    })
  } else if (path === '/script') {
    response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
    response.write('alert("这是javascript控制的")')
    response.end()
  } else {
    response.statusCode = 404
    response.end()
  }


  /******** 代码结束，下面不要看 ************/
})


function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = []
    request.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      resolve(body)
    })
  })
}
server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)
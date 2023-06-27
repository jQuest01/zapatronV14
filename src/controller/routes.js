// const fs = require('fs')

// app.post('/musicas', function (req, res) {
//     const jsonSongs = JSON.parse(fs.readFileSync(
//         'db.json',
//         'utf-8'
//     ))

//     const result = jsonSongs.musicas.filter((s) => {
//         return (s.url === req.body.url || (s.title === req.body.title && s.singers.some(r => req.body.singers.includes(r))))
//     })

//     if (!result.length) {
//         jsonSongs.musicas.push({
//             title: req.body.title,
//             url: req.body.url,
//             singers: req.body.singers,
//             id: jsonSongs.musicas.length + 1
//         })
//         fs.writeFileSync('db.json', JSON.stringify(jsonSongs))
//         res.send('Hello World')
//     }
// })

// app.get('/musicas', function (req, res) {
//     const jsonSongs = JSON.parse(fs.readFileSync(
//         'db.json',
//         'utf-8'
//     ))
//     res.send(jsonSongs)
// })
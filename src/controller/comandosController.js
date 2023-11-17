const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { getRandom } = require('../trivia/triviaUtils')
const { CronJob } = require('cron')
const CryptoJS = require("crypto-js");
const fs = require('fs')
const axios = require('axios')
const key = "12345";

inverteArray = (array) => {
    let newArray = []

    for (i = array.length - 1; i >= 0; i--) {
        newArray.push(array[i])
    }

    return newArray
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function TriviaPlayer(nickname, id, disc) {
    this.nickname = nickname
    this.id = id
    this.discriminator = disc
    this.points = 0
}

async function getTitleSpotify(page) {
    const body = await axios.get(page).then((response) => response.data)

    const preTitle = body.split('<title>')[1].split('</title>')[0]
    const song = preTitle.split('-')[0]
    const singer = preTitle.split('by')[1].split('|')[0]

    return (song + "-" + singer)
}

const jobToken = new CronJob('0 * * * *', async function () {
    console.log('Atualizando token')
    let config = JSON.parse(fs.readFileSync('./src/resources/config.json'))
    const token = await axios.post(`${jsonServer}/api/auth/token`, {
        email: CryptoJS.AES.decrypt(config.email, key).toString(CryptoJS.enc.Utf8),
        password: CryptoJS.AES.decrypt(config.pass, key).toString(CryptoJS.enc.Utf8)
    }).then((response) => response.data.token)

    config.token = CryptoJS.AES.encrypt(token, key).toString()
    fs.writeFileSync('./src/resources/config.json', JSON.stringify(config))
    console.log('Token atualizado com sucesso')
}, null, true, "America/Sao_Paulo");

module.exports = {
    async quiz(message) {
        try {
            if (!message.member.voice.channelId) {
                await message.channel.send({
                    embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")]
                })

                return null
            }

            if (isTriviaOn) {
                await message.channel.send({
                    embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Já tem um quiz rodando, espere esse acabar pra começar outro').setColor("#FF0000")]
                })

                return null
            }

            let config = JSON.parse(fs.readFileSync('./src/resources/config.json'))
            const header = {
                'Authorization': CryptoJS.AES.decrypt(config.token, key).toString(CryptoJS.enc.Utf8)
            }

            const jsonSongs = await axios.get(`${jsonServer}/musicas`, {
                headers: header
            }).then((res) => res.data)

            const intro = ['https://www.youtube.com/watch?v=HtDzVSgjjEc']
            const songsJson = intro.concat(getRandom(jsonSongs, 15))

            isTriviaOn = true
            playerTrivia = []

            const members = client.channels.cache.get(message.member.voice.channelId).members
            for (const mem of members) {
                if (mem[1].user.id !== '880450004123258990') {
                    playerTrivia.push(new TriviaPlayer(mem[1].user.username, mem[1].user.id, mem[1].user.discriminator))
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🎵 O Quiz de Música vai começar em breve')
                .setDescription(`Serão 15 músicas, 30 segundos por música.
                Tem que acertar tanto o cantor (ou um deles) e a música.
                
                + 1 ponto pelo(s) cantor(es)
                + 1 ponto pelo nome da música
                ------------------------------
                2 pontos por ambos
                Caso a mesma pessoa acerte tanto o cantor quanto a música, receberá 3 pontos
                
                🔥 O quiz vai começar em 10 segundos`)
                .setImage('https://www.useyourlocal.com/imgs/pub_events/730w/151119-093735_quiz-time.jpg')
                .setColor('#60d1f6')

            const playlist = await distube.createCustomPlaylist(songsJson, {
                member: message.member,
                properties: { name: "Quiz de música", source: "custom" },
                parallel: true
            });

            distube.play(message.member.voice.channel, playlist, {
                message,
                textChannel: message.channel,
                member: message.member
            });

            await message.channel.send({ embeds: [embed] })
        } catch (error) {
            console.log(error)
        }

    },

    async play(message) {
        try {
            var search = message.options.getString('musica');
        } catch (error) {
            if (!message.member.voice.channelId) {
                return new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")
            }

            const comando = message.content.substring(1).split(/ +/)[0]
            const index = message.content.indexOf(" ");
            if (index === -1) {
                return
            }
            var search = message.content.slice(comando.length + 2)
        }

        if(search.includes('spotify')){
            search = await getTitleSpotify(search)
        }
        
        try {
            distube.play(message.member.voice.channel, search, {
                textChannel: message.channel,
                member: message.member,
            });
        } catch (error) {
            console.log(error, ' Será feito uma nova tentativa')
            try {
                distube.play(message.member.voice.channel, search, {
                    textChannel: client.channels.cache.get('720766817588478054'),
                    member: message.member,
                });
            } catch (error) {
                console.log(error)
                return new EmbedBuilder().setTitle('Erro').setDescription('Erro ao incluir música/playlist\nTalvez o vídeo seja permitido apenas para maiores de idade').setColor("#FF0000")
            }
        }
    },

    async p(message) {
        await module.exports.play(message)
    },

    async pl(message) {
        await module.exports.play(message)
    },

    async ps(message) {
        try {
            var search = message.options.getString('musicas');
        } catch (error) {
            if (!message.member.voice.channelId) {
                return new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")
            }

            const comando = message.content.substring(1).split(/ +/)[0]
            const index = message.content.indexOf(" ");
            if (index === -1) {
                return
            }
            var search = message.content.slice(comando.length + 2)
        }

        search = search.split(',')
        const musicas = []
        for (const song of search) {
            if (song.includes('http') || song.includes('www')) {
                musicas.push(song)
            } else {
                await distube.search(song, {
                    limit: 1,
                    safeSearch: false
                }).then(async (result) => {
                    musicas.push(result[0].url)
                })
            }
        }
        const playlist = await distube.createCustomPlaylist(musicas, {
            member: message.member,
            properties: { name: "Playlist", source: "custom" },
            parallel: true
        });

        try {
            await distube.play(message.member.voice.channel, playlist, {
                textChannel: message.channel,
                member: message.member
            });
        } catch (error) {
            console.log(error, ' Será feito uma nova tentativa')
            try {
                await distube.play(message.member.voice.channel, playlist, {
                    textChannel: client.channels.cache.get('720766817588478054'),
                    member: message.member,
                });
            } catch (error) {
                console.log(error)
                return new EmbedBuilder().setTitle('Erro').setDescription('Erro ao incluir música ').setColor("#FF0000")
            }
        }
    },

    busca(message) {
        if (!message.member.voice.channelId) {
            return new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")
        }

        const comando = message.content.substring(1).split(/ +/)[0]
        const index = message.content.indexOf(" ");
        if (index === -1) {
            return
        }
        const search = message.content.slice(comando.length + 2)

        distube.search(search, {
            limit: 10,
            safeSearch: false
        }).then((result) => {
            if (result.length > 0) {
                let lista = '**Escolha uma das opções abaixo**\n'
                let i = 0
                result.forEach(song => {
                    lista += `${++i}) [${song.name} - ${song.uploader.name}](${song.url}) - ${song.formattedDuration}\n`
                })

                lista += '\nPara cancelar espere 30 segundos'

                const embed = new EmbedBuilder()
                    .setTitle('**Exibindo resultados para a busca**')
                    .setDescription(lista)
                    .setColor("#0099ff")

                message.channel.send({ embeds: [embed] })

                const collector = message.channel.createMessageCollector({
                    filter: (msg) => msg.author === message.author && msg.content <= i,
                    time: 30_000
                })

                let response = false
                collector.on('collect', (msg) => {
                    distube.play(msg.member.voice.channel, result[parseInt(msg.content) - 1].url, {
                        msg,
                        textChannel: msg.channel,
                        member: msg.member
                    })

                    response = true
                    collector.stop()
                })

                collector.on('end', () => {
                    if (!response) {
                        message.channel.send('Não foi recebido resposta adequada, busca cancelada')
                    }
                })
            }
        })
    },

    pause(message) {
        const queue = distube.getQueue(message.guildId)

        if (!queue || !queue.playing || isTriviaOn) {
            return
        }

        queue.pause()
    },

    continue(message) {
        const queue = distube.getQueue(message.guildId)

        if (!queue || !queue.paused || isTriviaOn) {
            return
        }

        queue.resume()
    },

    stop(message) {
        const queue = distube.getQueue(message.guildId)

        if (isTriviaOn) {
            return
        }

        if (!queue) {
            distube.stop(message)
            return
        }

        queue.stop()
    },

    async next(message) {
        const queue = distube.getQueue(message.guildId)

        if (!queue || queue.songs.length === 0 || isTriviaOn) {
            return
        }

        await queue.skip()
    },

    async volta(message) {
        const queue = distube.getQueue(message.guildId)

        if (!queue || isTriviaOn) {
            return
        }

        await queue.previous()
    },

    lista(message) {
        const queue = distube.getQueue(message.guildId)

        if (!queue || !queue.songs) {
            return new EmbedBuilder().setTitle('Erro').setDescription('A lista está vazia').setColor("#FF0000")
        }

        if (isTriviaOn) {
            return new EmbedBuilder().setTitle('Erro').setDescription('Tem um quiz rodando, não vou mostrar a lista').setColor("#FF0000")
        }

        let antes = queue.previousSongs
        let atual = queue.songs[0]
        let prox = queue.songs.slice(1)

        let lista = ''
        let pos = 0
        var verificaAnterior = false

        if (queue.repeatMode === 2) {
            lista += '** A lista está em loop **\n'
        }

        if (queue.repeatMode === 1) {
            lista += '** Essa música está em loop **\n'
            lista += '\n`    ⬐ tocando agora`\n'
            lista += `${pos}) [${atual.name}](${atual.url}) - ${atual.formattedDuration} \n`
            lista += '`    ⬑ tocando agora`\n'
        } else {
            if (antes.length) {
                verificaAnterior = true
                lista += '**Músicas que já tocaram**\n'
                pos = pos - antes.length

                for (i = 0; i < antes.length; i++) {
                    lista += `${pos}) [${antes[i].name}](${antes[i].url}) - ${antes[i].formattedDuration} \n`
                    pos++
                }
            }

            lista += '\n`    ⬐ tocando agora`\n'
            lista += `${pos}) [${atual.name}](${atual.url}) - ${atual.formattedDuration} \n`
            lista += '`    ⬑ tocando agora`\n'

            pos++

            if (prox.length) lista += '\n**Músicas que ainda vão tocar**\n'
            for (i = 0; i < prox.length; i++) {
                lista += `${pos}) [${prox[i].name}](${prox[i].url}) - ${prox[i].formattedDuration} \n`
                pos++
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('**Tem isso aqui na lista**')
            .setDescription(lista)
            .setColor("#0099ff")
        if (verificaAnterior) {
            embed.setFooter({ text: 'Os números negativos tão certos, facilita pra usar o comando de pular' })
        }
        try {
            message.editReply({ embeds: [embed] })
        } catch (error) {
            message.channel.send({
                embeds: [embed]
            })
        }

    },

    async loop(message) {
        let queue = distube.getQueue(message.guildId)

        if (!queue || !queue.songs || isTriviaOn) {
            const embed = new EmbedBuilder()
                .setDescription('Não foi possível executar esse comando, ou não há nada na lista, ou está tendo quiz de música')
                .setTitle('Erro')
                .setColor('#FF0000')

            try {
                await message.editReply({ embeds: [embed] })
            } catch (error) {
                await message.channel.send({ embeds: [embed] })
            }
        }

        try {
            var opt = message.options._hoistedOptions.map(x => x.value).toString()
        } catch (error) {
            const comando = message.content.substring(1).split(/ +/)[0]
            const index = message.content.indexOf(" ");

            var select = message.content.slice(comando.length + 2)

            if (['playlist', 'lista', 'musicas', 'músicas'].includes(select.toLowerCase())) {
                var opt = 'enable_loop_queue'
            } else if (['música', 'musica', 'song'].includes(select.toLowerCase())) {
                var opt = 'enable_loop_song'
            } else {
                var opt = 'disable_loop'
            }
        }

        switch (opt) {
            case ('enable_loop_queue'): {
                var repeat = 'entrar em loop'
                distube.setRepeatMode(message, 2);
                break
            }
            case ('enable_loop_song'): {
                var repeat = 'repetir essa música'
                distube.setRepeatMode(message, 1);
                break
            }
            case ('disable_loop'): {
                var repeat = 'não repetir'
                distube.setRepeatMode(message, 0);
                break
            }
        }

        const embed = new EmbedBuilder()
            .setDescription(`Playlist alterada para ${repeat}`)
            .setTitle('Loop')
            .setColor('Fuchsia')

        try {
            await message.editReply({ embeds: [embed] })
        } catch (error) {
            await message.channel.send({ embeds: [embed] })
        }

    },

    async pula(message) {
        let queue = distube.getQueue(message.guildId)

        if (!queue || !queue.songs || isTriviaOn) {
            return
        }

        try {
            var pos = message.options.getInteger('posicao');
        } catch (error) {
            const comando = message.content.substring(1).split(/ +/)[0]
            const index = message.content.indexOf(" ");
            if (index !== -1) {
                var pos = message.content.slice(comando.length + 2)
                try {
                    pos = parseInt(pos)
                } catch (error) {
                    console.log(error)
                }
            }
        }

        if (pos === 0) return
        if (pos < 0 && queue.previousSongs.length < 1) return
        if (pos > 0 && queue.songs.length < 1) return

        queue.jump(pos)
        try {
            await message.channel.send({ content: `Pulado com sucesso.` });
        } catch (error) {
            await inter.editReply({ content: `Pulado com sucesso.` });
        }

    }

}
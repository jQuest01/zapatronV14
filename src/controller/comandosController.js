const { EmbedBuilder } = require('discord.js')
const { getRandom } = require('../trivia/triviaUtils')
const CryptoJS = require("crypto-js");
const fs = require('fs')
const axios = require('axios')
const key = "12345";
// const { YouTubePlugin } = require("@distube/youtube")
// const { DisTube } = require('distube');

const calculaDuracao = (milis) => {
    milis = milis / 1000
    return `${milis / 60 | 0}:${milis % 60 < 10 ? '0' + milis % 60 : milis % 60}`
}

const getLetra = (title) =>
    new Promise(async (res, rej) => {
        const url = `https://some-random-api.ml/lyrics?title=${title}`
        try {
            const { data } = await axios.get(url);
            res(data);
        } catch (error) {
            rej(error);
        }
    });

const validaRepeat = (repeat) => {
    switch (repeat) {
        case (0): {
            return "none"
        }
        case (1): {
            return 'queue'
        }
        case (2): {
            return 'track'
        }
    }
}


const cortaNome = (length, value) => {
    const replaced = value.replace(/\n/g, "--");
    const regex = `.{1,${length}}`;
    const lines = replaced
        .match(new RegExp(regex, "g"))
        .map((line) => line.replace(/--/g, "\n"));
    return lines;
};

const inverteArray = (array) => {
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

module.exports = {
    async updateToken(message) {
        console.log('Atualizando token')
        let config = JSON.parse(fs.readFileSync('./src/resources/config.json'))
        token = await axios.post(`${jsonServer}/api/auth/token`, {
            email: CryptoJS.AES.decrypt(config.email, key).toString(CryptoJS.enc.Utf8),
            password: CryptoJS.AES.decrypt(config.pass, key).toString(CryptoJS.enc.Utf8)
        }).then((response) => response.data.token)

        console.log('Token atualizado com sucesso')
    },

    async quiz(message) {
        try {
            const guildId = message.guild.id;
            const channelId = message.channel.id;
            const user = message.author;
            const voiceChannel = message.member.voice.channel;

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

            const header = {
                'Authorization': token
            }

            const jsonSongs = await axios.get(`${jsonServer}/api/musica`, {
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

            let player = manager.getPlayer(guildId)
            if (!player) {
                player = await manager.createPlayer({
                    guildId: guildId,
                    voiceId: voiceChannel.id,
                    textId: channelId,
                    deaf: true,
                    volume: 100
                });
            }

            for (const song of songsJson) {
                const result = await player.search(song, { requester: user });
                player.queue.add(result.tracks[0])
            }

            if (!player.playing && !player.paused) {
                player.play();
            }

            await message.channel.send({ embeds: [embed] })
        } catch (error) {
            console.log(error)
        }

    },

    async play(message) {
        try {
            const isInteraction = !!message.isCommand;

            // Campos corrigidos
            const guildId = isInteraction ? message.guildId : message.guild.id;
            const channelId = isInteraction ? message.channelId : message.channel.id;
            const user = isInteraction ? message.user : message.author;
            const voiceChannel = message.member.voice.channel;

            // Se for mensagem normal (prefix), validar canal de voz
            if (!voiceChannel) {
                return new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")
            }

            // Pegar o que foi digitado
            let search;
            if (isInteraction) {
                search = message.options.getString('musica');
            } else {
                const comando = message.content.substring(1).split(/ +/)[0];
                const index = message.content.indexOf(" ");
                if (index === -1) return;
                search = message.content.slice(comando.length + 2);
            }

            // Criar ou pegar player
            let player = manager.getPlayer(guildId)
            if (!player) {
                player = await manager.createPlayer({
                    guildId: guildId,
                    voiceId: voiceChannel.id,
                    textId: channelId,
                    deaf: true,
                    volume
                });
            }

            // Fazer a pesquisa
            const result = await player.search(search, { requester: user });

            if (!result.tracks.length) {
                return new EmbedBuilder().setTitle('Erro').setDescription('Nenhum resultado encontrado!');
            }

            if (result.type === "PLAYLIST") {
                for (const track of result.tracks) {
                    player.queue.add(track)
                }
            } else {
                const track = result.tracks[0]
                player.queue.add(track)
            }

            if (!player.playing && !player.paused) {
                player.play();
            }
        } catch (error) {
            console.error(error);
            return new EmbedBuilder().setTitle('Erro').setDescription('Erro ao incluir música/playlist.');
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
            const isInteraction = !!message.isCommand;

            // Campos corrigidos
            const guildId = isInteraction ? message.guildId : message.guild.id;
            const channelId = isInteraction ? message.channelId : message.channel.id;
            const user = isInteraction ? message.user : message.author;
            const voiceChannel = message.member.voice.channel;

            // Se for mensagem normal (prefix), validar canal de voz
            if (!voiceChannel) {
                return new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")
            }

            // Pegar o que foi digitado
            let search;
            if (isInteraction) {
                search = message.options.getString('musicas');
            } else {
                const comando = message.content.substring(1).split(/ +/)[0];
                const index = message.content.indexOf(" ");
                if (index === -1) return;
                search = message.content.slice(comando.length + 2);
            }

            search = search.split(',')

            // Criar ou pegar player
            let player = manager.getPlayer(guildId)
            if (!player) {
                player = await manager.createPlayer({
                    guildId: guildId,
                    voiceId: voiceChannel.id,
                    textId: channelId,
                    deaf: true,
                    volume
                });
            }

            // Fazer a pesquisa
            for (const song of search) {
                const result = await player.search(song, { requester: user });
                const track = result.tracks[0];
                player.queue.add(track);
            }

            if (!player.playing && !player.paused) {
                player.play();
            }
        } catch (error) {
            console.error(error);
            return new EmbedBuilder().setTitle('Erro').setDescription('Erro ao incluir música/playlist.');
        }
    },

    async busca(message) {
        const guildId = message.guild.id;
        const channelId = message.channel.id;
        const user = message.author;
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")
        }

        const comando = message.content.substring(1).split(/ +/)[0]
        const index = message.content.indexOf(" ");
        if (index === -1) {
            return
        }
        const search = message.content.slice(comando.length + 2)

        let player = manager.getPlayer(guildId)
        if (!player) {
            player = await manager.createPlayer({
                guildId: guildId,
                voiceId: voiceChannel.id,
                textId: channelId,
                deaf: true,
                volume
            });
        }

        const result = await player.search(search, {
            requester: user
        })

        if (result.tracks.length > 0) {
            let lista = '**Escolha uma das opções abaixo**\n'
            let i = 0
            result.tracks.forEach(song => {
                lista += `${++i}) [${song.title} - ${song.author}](${song.uri}) - ${calculaDuracao(song.length)}\n`
            })

            lista += '\nPara cancelar espere 30 segundos'

            const embed = new EmbedBuilder()
                .setTitle('**Exibindo resultados para a busca**')
                .setDescription(lista)
                .setColor("#0099ff")

            message.channel.send({ embeds: [embed] })

            const collector = message.channel.createMessageCollector({
                filter: (msg) => msg.author === message.author && (msg.content <= i && msg.content > 0),
                time: 30_000
            })

            let response = false
            collector.on('collect', (msg) => {
                const track = result.tracks[parseInt(msg.content) - 1];
                player.queue.add(track);

                if (!player.playing && !player.paused) {
                    player.play();
                }

                response = true
                collector.stop()
            })

            collector.on('end', () => {
                if (!response) {
                    message.channel.send('Não foi recebido resposta adequada, busca cancelada')
                }
            })
        }
    },

    pause(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.playing || player.paused || isTriviaOn) {
            return
        }

        player.pause(true)
    },

    continue(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.paused || isTriviaOn) {
            return
        }

        player.pause(false)
    },

    async stop(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || isTriviaOn) {
            return
        }

        prevHistory.clear()

        await player.destroy()
    },

    async next(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.playing || isTriviaOn) {
            return
        }

        await player.skip()
    },

    async volta(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || player.queue.previous.length < 1 || isTriviaOn) {
            return
        }

        if (prevHistory.size > 0) {
            const previousTrack = prevHistory.get(prevHistory.size)
            prevHistory.delete(prevHistory.size)

            player.play(previousTrack);
            backPressionado = true
        }
    },

    lista(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.queue) {
            return new EmbedBuilder().setTitle('Erro').setDescription('A lista está vazia').setColor("#FF0000")
        }

        if (isTriviaOn) {
            return new EmbedBuilder().setTitle('Erro').setDescription('Tem um quiz rodando, não vou mostrar a lista').setColor("#FF0000")
        }

        const prox = player.queue
        const atual = prox.current

        let lista = ''
        let pos = 0
        var verificaAnterior = false

        if (player.loop === 'queue') {
            lista += '** A lista está em loop **\n'
        }

        if (player.loop === 'track') {
            lista += '** Essa música está em loop **\n'
            lista += '\n`    ⬐ tocando agora`\n'
            lista += `${pos}) [${atual.title}](${atual.uri}) - ${calculaDuracao(atual.length)} \n`
            lista += '`    ⬑ tocando agora`\n'
        } else {
            if (prevHistory.size > 0) {
                verificaAnterior = true
                lista += '**Músicas que já tocaram**\n'
                pos = pos - prevHistory.size

                prevHistory.forEach((antes, unused) => {
                    lista += `${pos}) [${antes.title}](${antes.uri}) - ${calculaDuracao(antes.length)} \n`
                    pos++
                })
            }

            lista += '\n`    ⬐ tocando agora`\n'
            lista += `${pos}) [${atual.title}](${atual.uri}) - ${calculaDuracao(atual.length)} \n`
            lista += '`    ⬑ tocando agora`\n'

            pos++

            if (prox.length) lista += '\n**Músicas que ainda vão tocar**\n'
            for (i = 0; i < prox.length; i++) {
                lista += `${pos}) [${prox[i].title}](${prox[i].uri}) - ${calculaDuracao(prox[i].length)} \n`
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
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)
        let queue = queue = player.queue

        if (!player || !queue || isTriviaOn) {
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
            var opt = message.options.getString('opcao')
        } catch (error) {
            const comando = message.content.substring(1).split(/ +/)[0]

            var select = message.content.slice(comando.length + 2)

            if (['playlist', 'lista', 'musicas', 'músicas'].includes(select.toLowerCase())) {
                opt = 'queue'
            } else if (['música', 'musica', 'song'].includes(select.toLowerCase())) {
                opt = 'track'
            } else {
                opt = 'none'
            }
        }

        let repeat = ''

        switch (opt) {
            case ('queue'): {
                repeat = 'entrar em loop'
                break
            }
            case ('track'): {
                repeat = 'repetir essa música'
                break
            }
            case ('none'): {
                repeat = 'não repetir'
                break
            }
        }

        player.setLoop(opt)

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

    async mute(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.queue.current || isTriviaOn) {
            return
        }

        player.setVolume(0)
    },

    async unmute(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.queue.current || isTriviaOn) {
            return
        }

        player.setVolume(volume)
    },

    async mais(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.queue.current || isTriviaOn) {
            return
        }

        player.setVolume(volume + 10)
        volume = volume + 10
    },

    async menos(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.queue.current || isTriviaOn) {
            return
        }

        player.setVolume(volume - 10)
        volume = volume - 10
    },

    async loopBtn(message) {
        const isInteraction = !!message.isCommand;

        if (!isInteraction) return
        const guildId = message.guildId
        const player = manager.getPlayer(guildId)

        repeat = repeat > 1 ? 0 : repeat + 1
        player.setLoop(validaRepeat(repeat));
    },

    async shuffle(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        if (!player || !player.queue.current || isTriviaOn) {
            return
        }

        await player.queue.shuffle();
    },

    async letra(message) {
        const isInteraction = !!message.isCommand;
        const guildId = isInteraction ? message.guildId : message.guild.id;
        const player = manager.getPlayer(guildId)

        const queue = player.queue

        try {
            var index = message.content.indexOf(" ");
        } catch (error) {
            index = -1
        }
        var title = ''
        if (index !== -1) {
            title = message.content.slice(index + 1)
        } else if (player && queue) {
            title = queue.current.title
        } else {
            return message.channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle('Erro')
                    .setDescription('')
                    .setColor("#FF0000")]
            });
        }

        if (title.includes('[Official Music Video]') || title.includes('(Official Music Video)')) {
            var indexT = title.includes('[Official Music Video]') ? title.indexOf('[Official Music Video]') : title.indexOf('(Official Music Video)')
            title = title.slice(0, indexT) + title.slice(indexT + 22, title.length)
        }

        if (title.includes('[')) {
            title = title.slice(0, title.indexOf('[')) + title.slice(title.indexOf(']') + 1, title.length)
        }

        try {
            const embeds = []
            console.log(await player.fetchLyrics)
            const lyrics = await player.fetchLyrics.then(res => res.data)
            embeds.push(new EmbedBuilder()
                .setTitle(`${title} - ${queue.current.author}`)
                .setDescription(lyrics)
                .setImage(queue.current.thumbnail)
                .setColor(config.cores.azul))

            return message.channel.send({
                embeds
            });
        } catch (err) {
            console.log(new Date(), err)
            message.channel.send({
                embeds: [new EmbedBuilder().setTitle("")
                    .setDescription("Não encontrei a letra dessa música")
                    .setColor(config.cores.vermelho)
                ]
            })
        }

    },

}
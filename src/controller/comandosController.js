const { QueryType, QueueRepeatMode } = require('discord-player')
const { EmbedBuilder } = require('discord.js')
const { getRandom } = require('../trivia/triviaUtils')
const fs = require('fs')

inverteArray = (array) => {
    let newArray = []

    for (i = array.length - 1; i >= 0; i--) {
        newArray.push(array[i])
    }

    return newArray
}

function TriviaPlayer(nickname, id, disc) {
    this.nickname = nickname
    this.id = id
    this.discriminator = disc
    this.points = 0
}

module.exports = {
    async trivia(message) {
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

        const jsonSongs = fs.readFileSync(
            './src/resources/songs.json',
            'utf-8'
        );

        const songsJson = getRandom(JSON.parse(jsonSongs), 15)

        isTriviaOn = true
        playerTrivia = []

        const members = client.channels.cache.get(message.member.voice.channelId).members
        for (const mem of members) {
            if (mem[1].user.id !== '880450004123258990') {
                playerTrivia.push(new TriviaPlayer(mem[1].user.username, mem[1].user.id, mem[1].user.discriminator))
            }
        }

        await player.play(message.member.voice.channel, 'https://www.youtube.com/watch?v=poRbwlbtSh0', {
            nodeOptions: {
                metadata: message.channel
            }
        });

        for (let i = 0; i < 15; i++) {
            try {
                await player.play(message.member.voice.channel, songsJson[i].url, {
                    nodeOptions: {
                        metadata: message.channel
                    }
                })
            } catch (error) {
                console.log(error)
            }

        }
    },

    async play(message) {

        try {
            var search = message.options.getString('musica');
        } catch (error) {
            if (!message.member.voice.channelId) {
                return await message.channel.send({
                    embeds: [new EmbedBuilder().setTitle('Erro').setDescription('Entre no chat de voz primeiro').setColor("#FF0000")]
                })
            }

            const comando = message.content.substring(1).split(/ +/)[0]
            const index = message.content.indexOf(" ");
            if (index === -1) {
                return

            }
            var search = message.content.slice(comando.length + 2)
        }

        let query = ''
        if (search.includes('http')) {
            query = QueryType.AUTO
        } else {
            query = QueryType.YOUTUBE
        }

        try {
            await player.play(message.member.voice.channel, search, {
                nodeOptions: {
                    selfDeaf: true,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000,
                    leaveOnStop: true,
                    leaveOnStopCooldown: 0,
                    metadata: message.channel
                },
                requestedBy: message.member,
                searchEngine: query
            });
        } catch (error) {
            await player.play(message.member.voice.channel, search, {
                nodeOptions: {
                    selfDeaf: true,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000,
                    leaveOnStop: true,
                    leaveOnStopCooldown: 0,
                    metadata: client.channels.cache.get('720766817588478054')
                },
                requestedBy: message.member,
                searchEngine: query
            });
        }

    },

    async p(message) {
        await module.exports.play(message)
    },

    async pl(message) {
        await module.exports.play(message)
    },

    pause(message) {
        const queue = player.nodes.get(message.guildId)

        if (!queue || !queue.isPlaying() || isTriviaOn) {
            return
        }

        queue.node.pause()
    },

    continue(message) {
        const queue = player.nodes.get(message.guildId)

        if (!queue || !queue.node.isPaused() || isTriviaOn) {
            return
        }

        queue.node.resume()
    },

    stop(message) {
        const queue = player.nodes.get(message.guildId)

        if (!queue || isTriviaOn) {
            return
        }

        queue.delete()
    },

    next(message) {
        const queue = player.nodes.get(message.guildId)

        if (!queue || isTriviaOn) {
            return
        }

        queue.node.skip()
    },

    async volta() {
        const queue = player.nodes.get(message.guildId)

        if (!queue || isTriviaOn) {
            return
        }

        await queue.history.previous(true)
    },

    lista(message) {
        const queue = player.nodes.get(message.guildId)

        if (!queue || !queue.currentTrack) {
            return new EmbedBuilder().setTitle('Erro').setDescription('A lista está vazia').setColor("#FF0000")
        }

        if (isTriviaOn) {
            return new EmbedBuilder().setTitle('Erro').setDescription('Tem um quiz rodando, não vou mostrar a lista').setColor("#FF0000")
        }

        let antes = queue.history.tracks.data
        let atual = queue.currentTrack
        let prox = queue.tracks.data

        let lista = ''
        let pos = 0
        var verificaAnterior = false

        if (queue.repeatMode === 2) {
            lista += '** A lista está em loop **\n'
        }

        if (queue.repeatMode === 1) {
            lista += '** Essa música está em loop **\n'
            lista += '\n`    ⬐ tocando agora`\n'
            lista += `${pos}) [${atual.title}](${atual.url}) - ${atual.duration} \n`
            lista += '`    ⬑ tocando agora`\n'
        } else {
            if (antes.length) {
                verificaAnterior = true
                lista += '**Músicas que já tocaram**\n'
                pos = pos - antes.length
                antes = inverteArray(antes)

                for (i = 0; i < antes.length; i++) {
                    lista += `${pos}) [${antes[i].title}](${antes[i].url}) - ${antes[i].duration} \n`
                    pos++
                }
            }

            lista += '\n`    ⬐ tocando agora`\n'
            lista += `${pos}) [${atual.title}](${atual.url}) - ${atual.duration} \n`
            lista += '`    ⬑ tocando agora`\n'

            pos++

            if (prox.length) lista += '\n**Músicas que ainda vão tocar**\n'
            for (i = 0; i < prox.length; i++) {
                lista += `${pos}) [${prox[i].title}](${prox[i].url}) - ${prox[i].duration} \n`
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
        let queue = player.nodes.get(message.guildId)

        if (!queue || !queue.currentTrack || isTriviaOn) {
            return
        }

        try {
            var opt = message.options._hoistedOptions.map(x => x.value).toString()
        } catch (error) {
            const comando = message.content.substring(1).split(/ +/)[0]
            const index = message.content.indexOf(" ");

            if (index !== -1) {
                var select = message.content.slice(comando.length + 2)

                if (['playlist', 'lista', 'musicas', 'músicas'].includes(select.toLowerCase())) {
                    var opt = 'enable_loop_queue'
                } else if (['música', 'musica', 'song'].includes(select.toLowerCase())) {
                    var opt = 'enable_loop_song'
                } else {
                    var opt = 'disable_loop'
                }
            }
        }

        switch (opt) {
            case ('enable_loop_queue'): {
                var repeat = QueueRepeatMode.QUEUE
                queue.setRepeatMode(QueueRepeatMode.QUEUE);
                break
            }
            case ('enable_loop_song'): {
                var repeat = QueueRepeatMode.TRACK
                queue.setRepeatMode(QueueRepeatMode.TRACK);
                break
            }
            case ('disable_loop'): {
                var repeat = QueueRepeatMode.OFF
                queue.setRepeatMode(QueueRepeatMode.OFF);
                break
            }
        }

        const embed = new EmbedBuilder()
            .setDescription(`Playlist alterada para ${QueueRepeatMode.OFF === repeat ? 'não repetir' : QueueRepeatMode.TRACK === repeat ? 'repetir essa música' : 'entrar em loop'}`)
            .setTitle('Loop')
            .setColor('Fuchsia')

        try {
            await message.editReply({ embeds: [embed] })
        } catch (error) {
            await message.channel.send({ embeds: [embed] })
        }

    },

    async pula(message) {
        let queue = player.nodes.get(message.guildId)

        if (!queue || !queue.currentTrack || isTriviaOn) {
            return
        }

        const comando = message.content.substring(1).split(/ +/)[0]
        const index = message.content.indexOf(" ");

        if (index !== -1) {
            let pos = message.content.slice(comando.length + 2)
            try {
                pos = parseInt(pos)
                let lista = []

                if (pos === 0) {
                    return
                } else if (pos < 0) {
                    lista = queue.history.tracks.data
                    pos = pos + lista.length
                    const track = inverteArray(lista)[pos]

                    for (i = 0; i < lista.length; i++) {
                        if (queue.currentTrack.url === track.url) {
                            return
                        } else {
                            await queue.history.previous(true)
                            queue = player.nodes.get(message.guildId)
                        }
                    }
                } else {
                    pos = pos - 1
                    lista = queue.tracks.data

                    const track = inverteArray(lista)[pos]

                    for (i = 0; i < lista.length; i++) {
                        if (queue.currentTrack.url === track.url) {
                            return
                        } else {
                            queue.node.skip()
                            queue = player.nodes.get(message.guildId)
                        }
                    }
                }
            } catch (error) {
                console.log(error)
            }

        }
    }
}
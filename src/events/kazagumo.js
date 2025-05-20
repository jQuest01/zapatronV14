const { EmbedBuilder } = require('discord.js')
const { normalizeValue, atualizaTriviaPlayer, getTriviaPlayer, capitalizeWords, getLeaderBoard } = require('../trivia/triviaUtils')
const { montaBotoesConfig } = require('../controller/botoesController')
const axios = require('axios');

manager.on('playerResolveError', (player, track, message) => {
    console.log('playerResolveError', message, player, track)
})

manager.on('playerException', (player, data) => {
    console.log('playerException', data.exception)
})

// manager.on('playerEnd', (player) => {
//     console.log('playerEnd')
//     const guildId = player.guildId;
//     const history = prevHistory.get(guildId) || [];

//     history.push(player.queue.currentTrack);
//     prevHistory.set(guildId, history);
// })

manager.on('playerStart', async (player, track) => {
    console.log('trigger playerStart')
    if (!isTriviaOn) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('A música que tá tocando é essa: ')
                .setDescription(`\n[${track.title}](${track.uri})`)
                .setImage(track.thumbnail)
                .setColor("0099ff")
                .setFooter({
                    text: `Adicionado por ${track.requester.username}`,
                    iconURL: track.requester.displayAvatarURL()
                })
            if (msgId === '') {
                client.channels.cache.get(player.textId).send({ embeds: [embed], components: montaBotoesConfig(player) }).then(msg => {
                    msgId = msgId === '' ? msg.id : msgId
                })
            } else {
                try {
                    client.channels.cache.get(player.textId).messages.edit(msgId, { components: montaBotoesConfig(player), embeds: [embed] })
                } catch (error) {
                    client.channels.cache.get(player.textId).send({ embeds: [embed], components: montaBotoesConfig(player) }).then(msg => {
                        msgId = msgId === '' ? msg.id : msgId
                    })
                }
            }

            if (player.queue.previous.length > 0) {
                const trackAtual = player.queue.previous[0]
                if (trackAtual.uri !== track.uri && !backPressionado) {
                    prevHistory.set(prevHistory.size + 1, trackAtual);
                }
                backPressionado = false
            }

        } catch (error) {
            console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
        }

    } else {
        if (track.uri !== 'https://www.youtube.com/watch?v=HtDzVSgjjEc') {
            await player.seek(30000)
            await triviaControl(player, player.guildId)
        }
    }
});

function checkSong(nameAnswer, guess) {
    return guess.match(nameAnswer) || nameAnswer.match(guess)
}

function checkSinger(singersAnswer, guess) {
    return singersAnswer.some(value => guess.match(normalizeValue(value)) || value.match(normalizeValue(guess)))
}

function checkBoth(nameAnswer, singersAnswer, guess) {
    return singersAnswer.some(value => guess.match(normalizeValue(value)) || value.match(normalizeValue(guess))) && (guess.split(' ').some(value => nameAnswer.match(value)))
}

function getMenor(singersAnswer) {
    let menor = 99

    for (let i = 0; i < singersAnswer.length; i++) {
        if (menor > singersAnswer[i].length) {
            menor = singersAnswer[i].length
        }
    }

    return menor
}

async function triviaControl(player, guildId) {
    const queue = player.queue
    let song = queue.current.uri
    let songNameFound = false;
    let songSingerFound = false;

    const header = {
        'Authorization': token
    }

    const songFiltrado = await axios.get(`${jsonServer}/api/musica`, { headers: header, params: { url: song } }).then((res) => res.data)

    let nameAnswer = ''
    let singersAnswer = []

    if (!songFiltrado) console.log(songFiltrado, new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), song)

    nameAnswer = normalizeValue(songFiltrado.title)
    singersAnswer = songFiltrado.singers
    let acertou = ''
    const filter = response => {
        const queue2 = manager.getPlayer(guildId).queue

        if (!getTriviaPlayer(response.author.id)) return false;
        if (!queue2 || queue2.current.uri !== song) return false

        const guess = normalizeValue(response.content);

        if (guess.length < nameAnswer.length / 2 && guess.length < getMenor(singersAnswer)) {
            response.react('❌')
            return false
        } else if (checkBoth(nameAnswer, singersAnswer, guess)) {
            response.react('☑');
            return true
        } else if ((checkSinger(singersAnswer, guess) && !songSingerFound) || (checkSong(nameAnswer, guess) && !songNameFound)) {
            response.react('☑');
            return true
        } else {
            response.react('❌')
            return false
        }
    };

    const collector = client.channels.cache.get(player.textId).createMessageCollector({ filter, max: 2, time: 30000 })

    collector.on('collect', async msg => {
        try {
            const guess = normalizeValue(msg.content);
            //se chutou os dois
            if (checkBoth(nameAnswer, singersAnswer, guess)) {
                if ((songSingerFound && !songNameFound) || (songNameFound && !songSingerFound)) {
                    const tPlayer = getTriviaPlayer(msg.author.id)
                    atualizaTriviaPlayer(msg.author.id, tPlayer.points + 1)
                }
                const tPlayer = getTriviaPlayer(msg.author.id)
                atualizaTriviaPlayer(msg.author.id, tPlayer.points + 3)

                songSingerFound = true
                songNameFound = true
            }
            //se chutou os cantores
            else if (checkSinger(singersAnswer, guess)) {
                if (songSingerFound) return; // already been found
                songSingerFound = true;
                if (acertou === '') {
                    acertou = msg.author.id
                    const tPlayer = getTriviaPlayer(acertou)
                    atualizaTriviaPlayer(acertou, tPlayer.points + 1)
                } else {
                    if (acertou !== msg.author.id) {
                        acertou = msg.author.id
                    }
                    const tPlayer = getTriviaPlayer(acertou)
                    atualizaTriviaPlayer(acertou, tPlayer.points + 2)
                }
            }
            // se chutou a música
            else if (checkSong(nameAnswer, guess)) {
                if (songNameFound) return; // already been guessed
                songNameFound = true;

                if (acertou === '') {
                    acertou = msg.author.id
                    const tPlayer = getTriviaPlayer(acertou)
                    atualizaTriviaPlayer(acertou, tPlayer.points + 1)
                } else {
                    if (acertou !== msg.author.id) {
                        acertou = msg.author.id
                    }
                    const tPlayer = getTriviaPlayer(acertou)
                    atualizaTriviaPlayer(acertou, tPlayer.points + 2)
                }
            }

            if (songNameFound && songSingerFound) {
                return collector.stop();
            }
        } catch (error) {
            console.log(error)
        }
    })

    collector.on('end', async () => {
        try {
            // if (!songNameFound && !songSingerFound) {
            acertou = ''
            const queue2 = manager.getPlayer(guildId).queue

            // if (!queue2 || queue2.songs[0].url !== song) {
            //     await queue.node.play(song, {
            //         nodeOptions: {
            //             metadata: queue.metadata
            //         }
            //     })
            //     return
            // }
            // }

            let musica = queue.current.uri
            if (song === queue2.current.uri) {
                let nameResposta = ''
                let cantorResposta = []

                musica = await axios.get(`${jsonServer}/api/musica`, { headers: header, params: { url: musica } }).then((res) => res.data)
                nameResposta = musica.title.toLowerCase()
                cantorResposta = musica.singers

                playerTrivia.sort((a, b) => {
                    return b.points - a.points;
                })

                const msc = `${capitalizeWords(nameResposta)} - ${capitalizeWords(cantorResposta.join(' & '))}`;

                const embed = new EmbedBuilder()
                    .setColor('#60d1f6')
                    .setTitle(`**A música era: ${msc}**`)
                    .setDescription('**__PLACAR DE XP__**\n\n' + getLeaderBoard(playerTrivia))
                    .setThumbnail(queue.current.thumbnail || 'https://cdn-icons-png.flaticon.com/512/2748/2748558.png')
                    .setFooter({ text: `Quiz de música - Faixa ${queue.previous.length}/15` })

                await client.channels.cache.get(player.textId).send({ embeds: [embed] });

                if (queue.previous.length === 15) {
                    player.destroy();
                    isTriviaOn = false

                    const embed = new EmbedBuilder()
                        .setColor('#60d1f6')
                        .setTitle('**Classificação do Quiz de Música**')
                        .setDescription(getLeaderBoard(playerTrivia))

                    await client.channels.cache.get(player.textId).send({ content: 'O Quiz de música acabou', embeds: [embed] });

                    return;
                }

                await player.skip();

            }
        } catch (error) {
            console.log(error)
        }
    })
}

manager.on('queueUpdate', (player, queue) => {
    console.log('trigger queueUpdate')
    if (!isTriviaOn) {
        if (queue.previous.length > 0 || queue.length > 0) {
            var embed = null
            try {
                embed = new EmbedBuilder()
                    .setTitle("**Adicionando a seguinte música na lista:**")
                    .setDescription(`\n[${queue[queue.length - 1].title}](${queue[queue.length - 1].uri})`)
                    .setImage(queue[queue.length - 1].thumbnail)
                    .setColor("0099ff")
            } catch (error) {
                embed = new EmbedBuilder()
                    .setTitle("**Adicionando a seguinte música na lista:**")
                    .setDescription(`\n[${queue.current.title}](${queue.uri})`)
                    .setImage(queue.thumbnail)
                    .setColor("0099ff")
            }
            client.channels.cache.get(player.textId).send({
                embeds: [embed]
            }).then(msg => {
                setTimeout(() => {
                    try {
                        msg.delete()
                    } catch (error) {
                        console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
                    }
                }, 10000)
            }).catch(err => console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), err))

            if (msgId !== '') {
                const embed = new EmbedBuilder()
                    .setTitle('A música que tá tocando é essa: ')
                    .setDescription(`\n[${queue.current.title}](${queue.current.uri})`)
                    .setImage(queue.current.thumbnail)
                    .setColor("0099ff")
                    .setFooter({
                        text: `Adicionado por ${queue.current.requester.username}`,
                        iconURL: queue.current.requester.displayAvatarURL()
                    })
                client.channels.cache.get(player.textId).messages.edit(msgId, { components: montaBotoesConfig(player), embeds: [embed] })
            }

        }
    }
});

manager.on('playerDestroy', (player) => {
    console.log('trigger playerDestroy')
    isTriviaOn = false
    if (msgId) {
        client.channels.cache.get(player.textId).messages.delete(msgId)
        msgId = ''
    }
    client.channels.cache.get(player.textId).send({
        embeds: [new EmbedBuilder()
            .setTitle("**Desconectado**")
            .setDescription('Precisar chama ✅')
            .setColor("0099ff")]
    });
    prevHistory.clear()
});

manager.on('playerEmpty', async (player) => {
    console.log('trigger playerEmpty')

    if (!isTriviaOn) {
        const tChannel = client.channels.cache.get(player.textId)
        tChannel.messages.delete(msgId)
        tChannel.send({
            embeds: [new EmbedBuilder()
                .setTitle("**Finalizou**")
                .setDescription('Foi bom enquanto durou mas a playlist acabou ✅')
                .setColor("0099ff")]
        }).then(() => {
            setTimeout(async () => {
                try {
                    let quitar = false
                    const queue = manager.getPlayer(player.guildId).queue

                    if (!queue || !queue.current) {
                        quitar = true
                    }

                    if (quitar) {
                        await player.destroy()
                    }
                } catch (error) {
                    console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
                }
            }, 300000)
        }).catch(err => console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), err))
        msgId = ''
    }
});

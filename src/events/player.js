const { EmbedBuilder } = require('discord.js');
const { useQueue, useMainPlayer } = require('discord-player')
const { montaBotoesConfig } = require('../controller/botoesController')
const { normalizeValue, atualizaTriviaPlayer, getTriviaPlayer, capitalizeWords, getLeaderBoard } = require('../trivia/triviaUtils')
const axios = require('axios')

player.events.on('error', (queue, error) => {
    // Emitted when the player queue encounters error
    console.log(`General player error event: ${error.message}`);
    console.log(error);
});

player.events.on('playerError', (queue, error) => {
    // Emitted when the audio player errors while streaming audio track
    console.log(`Player error event: ${error.message}`);
    console.log(error);
});

player.events.on('playerStart', async (queue, track) => {
    console.log('trigger playSong')
    if (!isTriviaOn) {
        const { member, channel } = queue.metadata
        try {
            const embed = new EmbedBuilder()
                .setTitle('A música que tá tocando é essa: ')
                .setDescription(`\n[${track.cleanTitle ? track.cleanTitle : track.title}](${track.url})`)
                .setImage(track.thumbnail)
                .setColor("0099ff")
                .setFooter({
                    text: `Adicionado por ${member.globalName ? member.globalName : member.username}`
                })
            if (msgId === '') {
                channel.send({ embeds: [embed], components: montaBotoesConfig(queue) }).then(msg => {
                    msgId = msgId === '' ? msg.id : msgId
                })
            } else {
                try {
                    client.channels.cache.get(channel.id).messages.edit(msgId, { components: montaBotoesConfig(queue), embeds: [embed] })
                } catch (error) {
                    channel.send({ embeds: [embed], components: montaBotoesConfig(queue) }).then(msg => {
                        msgId = msgId === '' ? msg.id : msgId
                    })
                }
            }
        } catch (error) {
            console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
        }
    } else {
        if (track.url !== 'https://www.youtube.com/watch?v=HtDzVSgjjEc') {
            // await queue.node.seek(30000)
            await triviaControl(queue)
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

async function triviaControl(queue) {
    const { id, channel } = queue.metadata
    let song = queue.tracks.data[0].url
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
        const queue2 = useQueue(id)

        if (!getTriviaPlayer(response.author.id)) return false;
        if (!queue2 || queue2.tracks.data[0].url !== song) return false

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

    const collector = channel.createMessageCollector({ filter, max: 2, time: 30000 })

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
        const queue2 = useQueue(id)
        try {
            // if (!songNameFound && !songSingerFound) {
            acertou = ''

            let musica = queue.tracks.data[0].url
            if (song === queue2.tracks.data[0].url) {
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
                    .setThumbnail(queue.tracks.data[0].thumbnail)
                    .setFooter({ text: `Quiz de música - Faixa ${queue.tracks && queue.tracks.length >= 0 ? 16 - queue.tracks.length : '15'}/15` })

                await channel.send({ embeds: [embed] });

                if (queue.tracks.length === 1) {
                    queue.stop();
                    isTriviaOn = false

                    const embed = new EmbedBuilder()
                        .setColor('#60d1f6')
                        .setTitle('**Classificação do Quiz de Música**')
                        .setDescription(getLeaderBoard(playerTrivia))

                    await channel.send({ content: 'O Quiz de música acabou', embeds: [embed] });

                    return;
                }

                await queue.skip();

            }
        } catch (error) {
            console.log(error)
        }
    })
}

player.events.on('audioTrackAdd', (queue, track) => {
    console.log('trigger addSong')
    if (!isTriviaOn) {
        const { channel } = queue.metadata

        if (queue.tracks.data[0].url !== track.url) {
            channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle("**Adicionando a seguinte música na lista:**")
                    .setDescription(`\n[${track.cleanTitle}](${track.url})`)
                    .setImage(track.thumbnail)
                    .setColor("0099ff")]
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
                    .setDescription(`\n[${queue.tracks.data[0].name}](${queue.tracks.data[0].url})`)
                    .setImage(queue.tracks.data[0].thumbnail)
                    .setColor("0099ff")
                    .setFooter({
                        text: `Adicionado por ${queue.tracks.data[0].member.globalName ? queue.tracks.data[0].member.globalName : queue.tracks.data[0].member.username}`
                    })
                client.channels.cache.get(channel.id).messages.edit(msgId, { components: montaBotoesConfig(queue), embeds: [embed] })
            }

        }
    }
});

player.events.on('disconnect', (queue) => {
    console.log('trigger disconnect')
    isTriviaOn = false
    const { channel } = queue.metadata
    if (msgId) {
        client.channels.cache.get(channel.id).messages.delete(msgId)
        msgId = ''
    }
    channel.send({
        embeds: [new EmbedBuilder()
            .setTitle("**Desconectado**")
            .setDescription('Precisar chama ✅')
            .setColor("0099ff")]
    });
});

player.events.on('emptyChannel', async (queue) => {
    console.log('trigger empty')
    isTriviaOn = false

    const { channel } = queue.metadata

    if (msgId) {
        client.channels.cache.get(channel.id).messages.delete(msgId)
        msgId = ''
    }

    await channel.send({
        embeds: [new EmbedBuilder()
            .setTitle("**#Abandonado**")
            .setDescription('Já que me abandonaram aqui, vou quitar também ❌')
            .setColor("0099ff")]
    });
});

player.events.on('emptyQueue', (queue) => {
    console.log('trigger finish')

    if (!isTriviaOn) {
        const { channel } = queue.metadata
        client.channels.cache.get(channel.id).messages.delete(msgId)
        channel.send({
            embeds: [new EmbedBuilder()
                .setTitle("**Finalizou**")
                .setDescription('Foi bom enquanto durou mas a playlist acabou ✅')
                .setColor("0099ff")]
        })
        // .then(msg => {
        //     setTimeout(() => {
        //         try {
        //             let quitar = false
        //             let channel = ''
        //             const queue2 = distube.getQueue('703253020716171365')

        //             if (!queue2) {
        //                 const queue3 = distube.getQueue('773910988927401994')
        //                 if (!queue3 || !queue3.playing()) quitar = true; channel = '773910988927401994'
        //             }
        //             if (!quitar && !queue2.playing()) quitar = true; channel = '703253020716171365'

        //             if (quitar) {
        //                 const bot = client.guilds.cache.get(channel).members.cache.get('880450004123258990')
        //                 bot.voice.setChannel(null)
        //             }
        //         } catch (error) {
        //             console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
        //         }
        //     }, 300000)
        // }).catch(err => console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), err))
        msgId = ''
    }
});

player.events.on('audioTracksAdd', (queue, tracks) => {
    console.log('trigger addList')
    if (!isTriviaOn) {
        const { channel } = queue.metadata
        channel.send({
            embeds: [new EmbedBuilder()
                .setTitle("**Playlist**")
                .setDescription('Playlist adicionada com sucesso ✅')
                .setColor("0099ff")]
        }).then(msg => {
            setTimeout(() => {
                try {
                    msg.delete()
                } catch (error) {
                    console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
                }
            }, 10000)
        }).catch(err => console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), err))
    }
});
const { EmbedBuilder } = require('discord.js')
const { normalizeValue, atualizaTriviaPlayer, getTriviaPlayer, capitalizeWords, getLeaderBoard } = require('../trivia/triviaUtils')
const { montaBotoesConfig } = require('../controller/botoesController')
const axios = require('axios');

// const { DisTube } = require('distube');
// const distube = new DisTube()
distube.on('error', (error, queue) => {
    console.log('trigger error')
    console.log({ queue, error })
    console.log(`Error emitted from the queue ${error.message}`);
});

distube.on('playSong', async (queue, track) => {
    console.log('trigger playSong')
    if (!isTriviaOn) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('A música que tá tocando é essa: ')
                .setDescription(`\n[${track.name}](${track.url})`)
                .setImage(track.thumbnail)
                .setColor("0099ff")
                .setFooter({
                    text: `Adicionado por ${track.member.displayName ? track.member.displayName : track.member.username}`,
                    iconURL: track.user.avatarURL()
                })
            if (msgId === '') {
                queue.textChannel.send({ embeds: [embed], components: montaBotoesConfig(queue) }).then(msg => {
                    msgId = msgId === '' ? msg.id : msgId
                })
            } else {
                try {
                    client.channels.cache.get(queue.textChannel.id).messages.edit(msgId, { components: montaBotoesConfig(queue), embeds: [embed] })
                } catch (error) {
                    queue.textChannel.send({ embeds: [embed], components: montaBotoesConfig(queue) }).then(msg => {
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
    let song = queue.songs[0].url
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
        const queue2 = distube.getQueue('703253020716171365')

        if (!getTriviaPlayer(response.author.id)) return false;
        if (!queue2 || queue2.songs[0].url !== song) return false

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

    const collector = queue.textChannel.createMessageCollector({ filter, max: 2, time: 30000 })

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
            const queue2 = distube.getQueue('703253020716171365')

            // if (!queue2 || queue2.songs[0].url !== song) {
            //     await queue.node.play(song, {
            //         nodeOptions: {
            //             metadata: queue.metadata
            //         }
            //     })
            //     return
            // }
            // }

            let musica = queue.songs[0].url
            if (song === queue2.songs[0].url) {
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
                    .setThumbnail(queue.songs[0].thumbnail)
                    .setFooter({ text: `Quiz de música - Faixa ${queue.songs && queue.songs.length >= 0 ? 16 - queue.songs.length : '15'}/15` })

                await queue.textChannel.send({ embeds: [embed] });

                if (queue.songs.length === 1) {
                    queue.stop();
                    isTriviaOn = false

                    const embed = new EmbedBuilder()
                        .setColor('#60d1f6')
                        .setTitle('**Classificação do Quiz de Música**')
                        .setDescription(getLeaderBoard(playerTrivia))

                    await queue.textChannel.send({ content: 'O Quiz de música acabou', embeds: [embed] });

                    return;
                }

                await queue.skip();

            }
        } catch (error) {
            console.log(error)
        }
    })
}

distube.on('addSong', (queue, track) => {
    console.log('trigger addSong')
    if (!isTriviaOn) {
        if (queue.songs[0].url !== track.url) {
            queue.textChannel.send({
                embeds: [new EmbedBuilder()
                    .setTitle("**Adicionando a seguinte música na lista:**")
                    .setDescription(`\n[${track.name}](${track.url})`)
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
                    .setDescription(`\n[${queue.songs[0].name}](${queue.songs[0].url})`)
                    .setImage(queue.songs[0].thumbnail)
                    .setColor("0099ff")
                    .setFooter({
                        text: `Adicionado por ${queue.songs[0].member.displayName ? queue.songs[0].member.displayName : queue.songs[0].member.username}`,
                        iconURL: queue.songs[0].user.avatarURL()
                    })
                client.channels.cache.get(queue.textChannel.id).messages.edit(msgId, { components: montaBotoesConfig(queue), embeds: [embed] })
            }

        }
    }
});

distube.on('disconnect', (queue) => {
    console.log('trigger disconnect')
    isTriviaOn = false
    if (msgId) {
        client.channels.cache.get(queue.textChannel.id).messages.delete(msgId)
        msgId = ''
    }
    queue.textChannel.send({
        embeds: [new EmbedBuilder()
            .setTitle("**Desconectado**")
            .setDescription('Precisar chama ✅')
            .setColor("0099ff")]
    });
});

distube.on('empty', async (queue) => {
    console.log('trigger empty')
    isTriviaOn = false
    if (msgId) {
        client.channels.cache.get(queue.textChannel.id).messages.delete(msgId)
        msgId = ''
    }
    await queue.textChannel.send({
        embeds: [new EmbedBuilder()
            .setTitle("**#Abandonado**")
            .setDescription('Já que me abandonaram aqui, vou quitar também ❌')
            .setColor("0099ff")]
    });

});

distube.on('finish', (queue) => {
    console.log('trigger finish')

    if (!isTriviaOn) {
        client.channels.cache.get(queue.textChannel.id).messages.delete(msgId)
        queue.textChannel.send({
            embeds: [new EmbedBuilder()
                .setTitle("**Finalizou**")
                .setDescription('Foi bom enquanto durou mas a playlist acabou ✅')
                .setColor("0099ff")]
        }).then(msg => {
            setTimeout(() => {
                try {
                    let quitar = false
                    let channel = ''
                    const queue2 = distube.getQueue('703253020716171365')

                    if (!queue2) {
                        const queue3 = distube.getQueue('773910988927401994')
                        if (!queue3 || !queue3.playing()) quitar = true; channel = '773910988927401994'
                    }
                    if (!quitar && !queue2.playing()) quitar = true; channel = '703253020716171365'

                    if (quitar) {
                        const bot = client.guilds.cache.get(channel).members.cache.get('880450004123258990')
                        bot.voice.setChannel(null)
                    }
                } catch (error) {
                    console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
                }
            }, 300000)
        }).catch(err => console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), err))
        msgId = ''
    }
});

distube.on('addList', (queue, tracks) => {
    console.log('trigger addList')
    if (!isTriviaOn) {
        queue.textChannel.send({
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

distube.on('searchResult', (message, result) => {
    console.log('trigger searchResult')
    let i = 0;
    message.channel.send(
        `**Escolha uma das opções abaixo**\n${result
            .map(
                song =>
                    `**${++i}**. ${song.name} - \`${song.formattedDuration
                    }\``,
            )
            .join(
                '\n',
            )}\n*Para cancelar, digite qualquer coisa ou espere 30 segundos*`,
    );

})
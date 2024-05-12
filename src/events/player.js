const { EmbedBuilder } = require('discord.js');
const { normalizeValue, atualizaTriviaPlayer, getTriviaPlayer, capitalizeWords, getLeaderBoard } = require('../trivia/triviaUtils')
const axios = require('axios')

player.events.on('error', (queue, error) => {
    console.log(`Error emitted from the queue ${error.message}`);
});

player.events.on('playerError', (queue, error) => {
    console.log(`Error emitted from the connection ${error.message}`);
});

player.events.on('playerStart', async (queue, track) => {
    if (!isTriviaOn) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('A música que tá tocando é essa: ')
                .setDescription(`\n[${track.title}](${track.url})`)
                .setImage(track.thumbnail)
                .setColor("0099ff")
                .setFooter({
                    text: `Adicionado por ${track.requestedBy.tag}`,
                    iconURL: track.requestedBy.avatarURL()
                })
            queue.metadata.send({ embeds: [embed] }).then(msg => {
                setTimeout(() => {
                    try {
                        msg.delete()
                    } catch (error) {
                        console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
                    }
                }, track.durationMS)
            })
        } catch (error) {
            console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
        }

    } else {
        if (queue.currentTrack.url !== 'https://www.youtube.com/watch?v=HtDzVSgjjEc') {
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
    return singersAnswer.some(value => guess.match(normalizeValue(value)) || value.match(normalizeValue(guess))) && (guess.match(nameAnswer) || nameAnswer.match(guess))
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
    let song = queue.currentTrack.url
    let songNameFound = false;
    let songSingerFound = false;

    const songFiltrado = await axios.get(`${jsonServer}/api/musica`, { params: { url: song } }).then((res) => res.data[0])

    let nameAnswer = ''
    let singersAnswer = []

    if (!songFiltrado) console.log(songFiltrado, new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), song)

    nameAnswer = normalizeValue(songFiltrado.title.toLowerCase())
    singersAnswer = songFiltrado.singers

    const filter = response => {
        const queue2 = player.nodes.get('703253020716171365')

        if (!getTriviaPlayer(response.author.id)) return false;
        if (!queue2 || queue2.currentTrack.url !== song) return false

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

    const collector = queue.metadata.createMessageCollector({ filter, max: 2, time: 30000 })

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
                atualizaTriviaPlayer(msg.author.id, tPlayer.points + 2)

                songSingerFound = songSingerFound ? songSingerFound : true
                songNameFound = songNameFound ? songNameFound : true
            }
            //se chutou os cantores
            else if (checkSinger(singersAnswer, guess)) {
                if (songSingerFound) return; // already been found
                songSingerFound = true;
                const tPlayer = getTriviaPlayer(msg.author.id)
                atualizaTriviaPlayer(msg.author.id, tPlayer.points + 1)

            }
            // se chutou a música
            else if (checkSong(nameAnswer, guess)) {
                if (songNameFound) return; // already been guessed
                songNameFound = true;

                const tPlayer = getTriviaPlayer(msg.author.id)
                atualizaTriviaPlayer(msg.author.id, tPlayer.points + 1)
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
            const queue2 = player.nodes.get('703253020716171365')

            if (!queue2 || queue2.currentTrack.url !== song) {
                await queue.node.play(song, {
                    nodeOptions: {
                        metadata: queue.metadata
                    }
                })
                return
            }

            let musica = queue.currentTrack.url
            let nameAnswer = ''
            let singersAnswer = []

            musica = await axios.get(`${jsonServer}/api/musica`, { params: { url: musica } }).then((res) => res.data[0])
            nameAnswer = musica.title.toLowerCase()
            singersAnswer = musica.singers

            playerTrivia.sort((a, b) => {
                return b.points - a.points;
            })

            const msc = `${capitalizeWords(nameAnswer)} - ${capitalizeWords(singersAnswer.join(' & '))}`;

            const embed = new EmbedBuilder()
                .setColor('#60d1f6')
                .setTitle(`**A música era: ${msc}**`)
                .setDescription('**__PLACAR DE XP__**\n\n' + getLeaderBoard(playerTrivia))
                .setThumbnail(queue.currentTrack.thumbnail)
                .setFooter({ text: `Quiz de música - Faixa ${queue.tracks.data.length && queue.tracks.data.length >= 0 ? 15 - queue.tracks.data.length : '15'}/15` })

            await queue.metadata.send({ embeds: [embed] });

            if (!queue.tracks.data.length) {
                queue.delete();
                isTriviaOn = false

                const embed = new EmbedBuilder()
                    .setColor('#60d1f6')
                    .setTitle('**Classificação do Quiz de Música**')
                    .setDescription(getLeaderBoard(playerTrivia))

                await queue.metadata.send({ content: 'O Quiz de música acabou', embeds: [embed] });

                return;
            }

            await queue.node.skip();
        } catch (error) {
            console.log(error)
        }
    })
}

player.events.on('audioTrackAdd', (queue, track) => {
    if (!isTriviaOn) {
        if (queue.currentTrack) {
            queue.metadata.send({
                embeds: [new EmbedBuilder()
                    .setTitle("**Adicionando a seguinte música na lista:**")
                    .setDescription(`\n[${track.title}](${track.url})`)
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
        }
    }
});

player.events.on('disconnect', (queue) => {
    isTriviaOn = false
    queue.metadata.send({
        embeds: [new EmbedBuilder()
            .setTitle("**Desconectado**")
            .setDescription('Precisar chama ✅')
            .setColor("0099ff")]
    });
});

player.events.on('emptyChannel', (queue) => {
    isTriviaOn = false
    queue.metadata.send({
        embeds: [new EmbedBuilder()
            .setTitle("**#Abandonado**")
            .setDescription('Já que me abandonaram aqui, vou quitar também ❌')
            .setColor("0099ff")]
    });
    queue.delete()
});

player.events.on('emptyQueue', (queue) => {
    if (!isTriviaOn) {
        queue.metadata.send({
            embeds: [new EmbedBuilder()
                .setTitle("**Finalizou**")
                .setDescription('Foi bom enquanto durou mas a playlist acabou ✅')
                .setColor("0099ff")]
        }).then(msg => {
            setTimeout(() => {
                try {
                    const queue2 = player.nodes.get('703253020716171365')
                    if (!queue2 || !queue2.isPlaying()) {
                        queue2.delete()
                    }
                } catch (error) {
                    console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), error)
                }
            }, 300000)
        }).catch(err => console.log(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), err))
    }
});

player.events.on('audioTracksAdd', (queue, tracks) => {
    if (!isTriviaOn) {
        queue.metadata.send({
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
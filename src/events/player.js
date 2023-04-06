const { EmbedBuilder } = require('discord.js');
const { normalizeValue, atualizaTriviaPlayer, getTriviaPlayer, capitalizeWords, getLeaderBoard } = require('../trivia/triviaUtils')
const fs = require('fs')

player.events.on('error', (queue, error) => {
    console.log(`Error emitted from the queue ${error.message}`);
});

player.events.on('playerError', (queue, error) => {
    console.log(`Error emitted from the connection ${error.message}`);
});

player.events.on('playerStart', async (queue, track) => {
    if (!isTriviaOn) {
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
                    console.log(new Date(), error)
                }
            }, track.durationMS)
        }).catch(err => console.log(new Date(), err))
    } else {
        if (queue.currentTrack.url !== 'https://www.youtube.com/watch?v=poRbwlbtSh0') {
            // await queue.node.seek(30000)

            triviaControl(queue)
        }
    }
});

function triviaControl(queue) {
    let song = queue.currentTrack.url
    let songNameFound = false;
    let songSingerFound = false;

    const collector = queue.metadata.createMessageCollector({ filter: (m) => getTriviaPlayer(m.author.id), time: 60000 })

    collector.on('collect', async msg => {
        try {
            let nameAnswer = ''
            let singersAnswer = []

            const songsJson = JSON.parse(fs.readFileSync(
                './src/resources/songs.json',
                'utf-8'
            ))

            const songFiltrado = songsJson.filter((e) => { return e.url === song })[0]

            nameAnswer = normalizeValue(songFiltrado.title.toLowerCase())
            singersAnswer = songFiltrado.singers

            let guess = normalizeValue(msg.content);
            //se chutou os dois
            if (singersAnswer.some(value => guess.match(normalizeValue(value)) || value.match(normalizeValue(guess))) && guess.match(nameAnswer)) {
                if ((songSingerFound && !songNameFound) || (songNameFound && !songSingerFound)) {
                    const tPlayer = getTriviaPlayer(msg.author.id)
                    atualizaTriviaPlayer(msg.author.id, tPlayer.points + 1)
                    msg.react('☑');
                    return collector.stop();
                }
                const tPlayer = getTriviaPlayer(msg.author.id)
                atualizaTriviaPlayer(msg.author.id, tPlayer.points + 2)
                msg.react('☑');
                return collector.stop();
            }
            //se chutou os cantores
            else if (singersAnswer.some(value => guess.match(normalizeValue(value)) || value.match(normalizeValue(guess)))) {
                if (songSingerFound) return; // already been found

                songSingerFound = true;
                if (songNameFound && songSingerFound) {
                    const tPlayer = getTriviaPlayer(msg.author.id)
                    atualizaTriviaPlayer(msg.author.id, tPlayer.points + 1)
                    msg.react('☑');
                    return collector.stop();
                }

                const tPlayer = getTriviaPlayer(msg.author.id)
                atualizaTriviaPlayer(msg.author.id, tPlayer.points + 1)
                msg.react('☑');
            }
            // se chutou a música
            else if (guess.match(nameAnswer) || nameAnswer.match(guess)) {
                if (songNameFound) return; // already been guessed
                songNameFound = true;

                if (songNameFound && songSingerFound) {
                    const tPlayer = getTriviaPlayer(msg.author.id)
                    atualizaTriviaPlayer(msg.author.id, tPlayer.points + 1)
                    msg.react('☑');
                    return collector.stop();
                }

                const tPlayer = getTriviaPlayer(msg.author.id)
                atualizaTriviaPlayer(msg.author.id, tPlayer.points + 1)
                msg.react('☑');
            }
            // se chutou e errou tudo

            else if (guess === 'skip') {
                return collector.stop()
            } else if (guess === 'stop') {
                const embed = new EmbedBuilder()
                    .setColor('#ff7373')
                    .setTitle(`Fim`)
                    .setDescription('Quiz finalizado a pedidos');

                queue.metadata.send({ embeds: [embed] });
                queue.delete()
                return collector.stop()
            }
            else {
                return msg.react('❌');
            }
        } catch (error) {
            console.log(error)
        }
    })

    collector?.on('end', async () => {
        try {
            let musica = queue.currentTrack.url
            let nameAnswer = ''
            let singersAnswer = []

            const songsJson = JSON.parse(fs.readFileSync(
                './src/resources/songs.json',
                'utf-8'
            ))

            musica = songsJson.filter((e) => { return e.url === musica })[0]
            nameAnswer = musica.title.toLowerCase()
            singersAnswer = musica.singers

            playerTrivia.sort((a, b) => {
                return b.points - a.points;
            })

            const song = `${capitalizeWords(
                singersAnswer.join(', ')
            )}: ${capitalizeWords(nameAnswer)}`;

            const embed = new EmbedBuilder()
                .setColor('#ff7373')
                .setTitle(`**A música era: ${song}**`)
                .setDescription(getLeaderBoard(playerTrivia))
                .setThumbnail(queue.currentTrack.thumbnail)
                .setFooter({ text: `Quiz de música - Faixa ${queue.tracks.data.length && queue.tracks.data.length >= 0 ? 15 - queue.tracks.data.length : '15'}/15` })

            queue.metadata.send({ embeds: [embed] });

            if (!queue.tracks.data.length) {
                queue.delete();
                isTriviaOn = false
                return;
            }

            await queue.node.skip();
        } catch (error) {
            console.log(error)
        }
    });
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
                        console.log(new Date(), error)
                    }
                }, 10000)
            }).catch(err => console.log(new Date(), err))
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
    queue.metadata.send({
        embeds: [new EmbedBuilder()
            .setTitle("**#Abandonado**")
            .setDescription('Já que me abandonaram aqui, vou quitar também ❌')
            .setColor("0099ff")]
    });
});

player.events.on('emptyQueue', (queue) => {
    if (!isTriviaOn) {
        queue.metadata.send({
            embeds: [new EmbedBuilder()
                .setTitle("**Finalizou**")
                .setDescription('Foi bom enquanto durou mas a playlist acabou ✅')
                .setColor("0099ff")]
        });
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
                    console.log(new Date(), error)
                }
            }, 10000)
        }).catch(err => console.log(new Date(), err))
    }
});
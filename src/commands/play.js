const { QueryType } = require('discord-player');
const { ApplicationCommandOptionType } = require('discord.js');
const { play } = require('../controller/comandosController')

module.exports = {
    name: 'play',
    description: "Adiciona uma música na playlist",
    voiceChannel: true,
    options: [
        {
            name: 'musica',
            description: 'a música pra adicionar',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        const song = inter.options.getString('musica');

        let query = ''
        if (song.includes('http')) {
            query = QueryType.AUTO
        } else {
            query = QueryType.YOUTUBE
        }

        const res = await player.search(song, {
            requestedBy: inter.member,
            searchEngine: query
        });

        await inter.editReply({ content: `Adicionando sua ${res.playlist ? 'playlist' : 'música'}... 🎧` });

        await play(inter).then(async (embed) => {
            if (embed) {
                await inter.editReply({ embeds: [embed] });
            } else {
                await inter.editReply({ content: `${res.playlist ? 'Playlist' : 'Música'} adicionada com sucesso 🎧` });
            }
        })

    },
};

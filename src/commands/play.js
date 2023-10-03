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

        await inter.editReply({ content: `Adicionando... 🎧` });

        await play(inter).then(async (embed) => {
            if (embed) {
                await inter.editReply({ embeds: [embed] });
            } else {
                await inter.editReply({ content: `Adicionado com sucesso 🎧` });
            }
        })

    },
};

const { ApplicationCommandOptionType } = require('discord.js');
const { ps } = require('../controller/comandosController')

module.exports = {
    name: 'plays',
    description: "Adiciona um array de músicas na playlist",
    voiceChannel: true,
    options: [
        {
            name: 'musicas',
            description: 'as músicas para adicionar, separe por vírgula',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });

        await inter.editReply({ content: `Adicionando suas músicas... 🎧` });

        await ps(inter).then(async (embed) => {
            if (embed) {
                await inter.editReply({ embeds: [embed] });
            } else {
                await inter.editReply({ content: `Músicas adicionadas com sucesso 🎧` });
            }
        })

    },
};

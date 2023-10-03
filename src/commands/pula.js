const { ApplicationCommandOptionType } = require('discord.js');
const { pula } = require('../controller/comandosController')

module.exports = {
    name: 'pula',
    description: "Pula para alguma posição da lista",
    voiceChannel: true,
    options: [
        {
            name: 'posicao',
            description: 'a posição da música na lista',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        }
    ],

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });

        await inter.editReply({ content: `Pulando para a posição escolhida...` });

        await pula(inter).then(async (embed) => {
            if (embed) {
                await inter.editReply({ embeds: [embed] });
            } else {
                await inter.editReply({ content: `Pulado com sucesso.` });
            }
        })

    },
};

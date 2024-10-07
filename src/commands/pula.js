const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const { pula } = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pula')
        .setDescription("Pula para alguma posição da lista")
        .addStringOption(new SlashCommandStringOption().setName('posicao').setDescription('a posição da música na lista').setRequired(true)),
    voiceChannel: true,

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

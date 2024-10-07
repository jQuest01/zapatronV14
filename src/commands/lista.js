const { SlashCommandBuilder } = require('discord.js');
const { lista } = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lista')
        .setDescription("Exibe a playlist"),
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        const embed = lista(inter)

        if (embed) {
            await inter.editReply({ embeds: [embed] })
        }
    },
};

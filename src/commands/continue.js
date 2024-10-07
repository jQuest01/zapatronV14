const { SlashCommandBuilder } = require('discord.js');
const comandosController = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('continue')
        .setDescription("Despausa a playlist"),
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });

        comandosController.continue(inter)

        return inter.editReply({ content: 'Playlist despausada com sucesso.' });

    },
};

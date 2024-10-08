const { SlashCommandBuilder } = require('discord.js');
const { pause } = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription("Pausa a playlist"),
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        
        pause(inter)

        return inter.editReply({ content: 'Playlist pausada com sucesso.' });

    },
};

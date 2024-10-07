const { SlashCommandBuilder } = require('discord.js');
const { next } = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription("Pula para a próxima música"),
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        next(inter)
        await inter.editReply({ content: 'Música skipada' });
    },
};

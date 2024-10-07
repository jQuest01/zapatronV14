const { SlashCommandBuilder } = require('discord.js');
const { stop } = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription("Para e zera a playlist"),
    voiceChannel: true,

    async execute({ inter }) {
        stop(inter)

    },
};

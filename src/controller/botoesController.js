const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js')
// const { epic, prime, updateConfig, updateSteam } = require('./controllerExternos')

// let idsArray = new HashMap()

module.exports = {

    montaBotoesConfig(interaction) {
        let row = new ActionRowBuilder()

        return telaInicial(row, interaction)
    },


}

function telaInicial(row, interaction) {
    if (!interaction) return []
    let rows = []
    const queue = interaction.guildId ? distube.getQueue(interaction.guildId) : interaction

    row.addComponents(
        new ButtonBuilder()
            .setCustomId('volta')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:skipback:1243671127356604541>')
            .setDisabled(queue.previousSongs.length <= 0),

        queue.playing ?
            new ButtonBuilder()
                .setCustomId('pause')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<:pause:1243671119274315846>') :
            new ButtonBuilder()
                .setCustomId('continue')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<:play:1243671120658432071>'),

        new ButtonBuilder()
            .setCustomId('next')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:skipforward:1243671128732336189>')
            .setDisabled(queue.songs.length <= 1),
        new ButtonBuilder()
            .setCustomId('letra')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Lyrics')
            .setDisabled(true)
    )

    rows.push(row)
    row = new ActionRowBuilder()
    row.addComponents(
        new ButtonBuilder()
            .setCustomId('menos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:volume1:1243671133040017539>')
            .setDisabled(volume === 0),
        queue.volume ?
            new ButtonBuilder()
                .setCustomId('mute')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('<:volumex:1243671175247298661>') :

            new ButtonBuilder()
                .setCustomId('unmute')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<:volume:1243671131806765129>'),

        new ButtonBuilder()
            .setCustomId('mais')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:volume2:1243671134646571080>')
            .setDisabled(volume === 100),

        new ButtonBuilder()
            .setCustomId('volume')
            .setDisabled(true)
            .setLabel('Volume ' + queue.volume + '%')
            .setStyle(ButtonStyle.Secondary)
    )

    rows.push(row)
    row = new ActionRowBuilder()
    row.addComponents(
        new ButtonBuilder()
            .setCustomId('loopBtn')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:repeat:1243671122093015100>'),
        new ButtonBuilder()
            .setCustomId('stop')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('<:stop:1244639250776068147>'),
        new ButtonBuilder()
            .setCustomId('shuffle')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:shuffle:1243671124131184772>'),
        new ButtonBuilder()
            .setCustomId('repeat')
            .setDisabled(true)
            .setLabel(validaRepeat(queue.repeatMode))
            .setStyle(ButtonStyle.Secondary)
    )

    rows.push(row)

    return rows
}

const validaRepeat = (repeat) => {
    switch (repeat) {
        case (0): {
            return 'Repetição desativada'
        }
        case (1): {
            return 'Repetindo lista'
        }
        case (2): {
            return 'Repetindo música'
        }
    }
}
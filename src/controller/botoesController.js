const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js')
// const HashMap = require('hashmap')
const feather = require('feather-icons')
const comandosController = require('./comandosController')
// const { epic, prime, updateConfig, updateSteam } = require('./controllerExternos')

// let idsArray = new HashMap()

module.exports = {

    montaBotoesConfig(interaction) {

        let row = new ActionRowBuilder()
        // if (interaction == undefined || interaction.customId == 'btnVoltar') {
            return telaInicial(row)
        // } else {
        //     if (interaction.customId == 'btnCanal') {
        //         return telaCanais(row, client)
        //     } else if (interaction.customId == 'btnPrefixo') {
        //         return telaPrefixos(row)
        //     } else if (interaction.customId == 'btnEpic') {
        //         return telaEpic(row)
        //     } else if (interaction.customId == 'btnPrime') {
        //         return telaPrime(row)
        //     } else if (interaction.customId == 'btnSteamIDs') {
        //         return telaSteamIDs(row)
        //     } else if (interaction.customId == 'btnSalvar') {
        //         return telaSalvar(row)
        //     } else if (interaction.customId == 'btnTesteEpic') {
        //         epic(undefined, client)
        //         return telaEpic(row)
        //     } else if (interaction.customId == 'btnTestePrime') {
        //         prime(undefined, client)
        //         return telaPrime(row)
        //     }
        // }
        // return row
    },

    // async controleMenuSelector(interaction) {
    //     if (interaction.customId == 'prefixos') {
    //         config.prefix = interaction.values[0]
    //     } else if (interaction.customId == 'canais') {
    //         config.canal_padrao = interaction.values[0]
    //     } else if (interaction.customId == 'epic') {
    //         config.epic = interaction.values[0]
    //     } else if (interaction.customId == 'prime') {
    //         config.prime = interaction.values[0]
    //     } else if (interaction.customId == 'steamIds') {
    //         idsArray = await carregaSteamIds()
    //         let idsSelecionados = interaction.values

    //         let arrayId = idsArray.values()

    //         idsArray.forEach((id, key) => {
    //             if (!idsSelecionados.includes(key.toString())) {
    //                 arrayId.splice(key - 1, 1, { steamId: id.steamId, status: false })
    //             } else {
    //                 arrayId.splice(key - 1, 1, { steamId: id.steamId, status: true })
    //             }
    //         })
    //         idsArray.clear()
    //         for (i = 0; i < arrayId.length; i++) {
    //             idsArray.set(i + 1, {
    //                 steamId: arrayId[i].steamId,
    //                 status: arrayId[i].status
    //             })
    //         }
    //     }
    // },

    // async salvaConfiguracoes() {
    //     // let data = JSON.stringify(config, null, 2)
    //     await updateConfig(config)

    //     idsArray.forEach(async (id, key) => {
    //         await updateSteam({ steamId: id.steamId, status: id.status })
    //     })
    // }

}

// function organizaCanais(canais) {

//     let canaisOrganizados = []

//     for (const canal of canais.values()) {
//         if (canal.type == 'GUILD_TEXT' && canal.name != 'geral') {
//             canaisOrganizados.push({
//                 nome: canal.name,
//                 id: canal.id,
//                 posicao: canal.rawPosition
//             })
//         }
//     }

//     canaisOrganizados.sort((a, b) => (a.posicao > b.posicao) ? 1 : ((b.posicao > a.posicao) ? -1 : 0))

//     return canaisOrganizados

// }

function telaInicial(row) {
    let rows = []
    feather.icons.play
    row.addComponents(
        new ButtonBuilder()
            .setCustomId('volta')
            .setStyle(ButtonStyle.Primary)
            .setLabel(feather.icons.play)
    //     new ButtonBuilder()
    //         .setCustomId('btnPrefixo')
    //         .setStyle(ButtonStyle.Primary)
    //         .setLabel('Prefixo'),
    //     new ButtonBuilder()
    //         .setCustomId('btnEpic')
    //         .setStyle(ButtonStyle.Secondary)
    //         .setLabel('Epic')
    //         .setEmoji('<:epic:930130129542344785>'),
    //     new ButtonBuilder()
    //         .setCustomId('btnPrime')
    //         .setStyle(ButtonStyle.Secondary)
    //         .setLabel('Prime')
    //         .setEmoji('<:prime_gaming:930135141815312484>'),
    //     new ButtonBuilder()
    //         .setCustomId('btnSteamIDs')
    //         .setStyle(ButtonStyle.Secondary)
    //         .setLabel('Steam IDs')
    //         .setEmoji('<:steam_id:930818712771108955>')
    )

    // rows.push(row)


    // //Botões salvar e descartar - manter sempre na ultima linha
    // row = new ActionRowBuilder()

    // row.addComponents(
    //     new ButtonBuilder()
    //         .setCustomId('btnSalvar')
    //         .setStyle(ButtonStyle.Success)
    //         .setLabel('Salvar Alterações')
    //         .setEmoji('💾'),
    //     new ButtonBuilder()
    //         .setCustomId('btnDescartar')
    //         .setStyle(ButtonStyle.Danger)
    //         .setLabel('Descartar Alterações')
    //         .setEmoji('🗑️')
    // )

    rows.push(row)

    return rows
}

// function telaPrefixos(row) {
//     let rows = []
//     prefixoAtual = config.prefix
//     row.addComponents(
//         new StringSelectMenuBuilder()
//             .setCustomId('prefixos')
//             .setOptions([
//                 {
//                     label: '!',
//                     value: '!',
//                     default: prefixoAtual == '!' ? true : false,
//                 },
//                 {
//                     label: '-',
//                     value: '-',
//                     default: prefixoAtual == '-' ? true : false,
//                 },
//                 {
//                     label: '*',
//                     value: '*',
//                     default: prefixoAtual == '*' ? true : false,
//                 }
//             ])
//     )

//     rows.push(row)

//     row = new ActionRowBuilder()

//     row.addComponents(
//         new ButtonBuilder()
//             .setCustomId('btnVoltar')
//             .setStyle(ButtonStyle.Secondary)
//             .setLabel('Voltar')
//             .setDisabled(false)
//     )

//     rows.push(row)

//     return rows
// }

function telaCanais(row, client) {
    let canais = client.channels.cache
    let rows = []
    let options = []

    canais = organizaCanais(canais)

    let canalAtual = config.canal_padrao

    for (const canal of canais) {
        options.push({
            label: canal.nome,
            value: canal.id,
            default: canalAtual == canal.id ? true : false,
            emoji: '<:hashtag:930154958047809606>'
        })
    }

    row.addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`canais`)
            .setPlaceholder('Selecione um canal')
            .setOptions(options)
    )

    rows.push(row)

    row = new ActionRowBuilder()

    row.addComponents(
        new ButtonBuilder()
            .setCustomId('btnVoltar')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Voltar')
            .setDisabled(false)
    )

    rows.push(row)

    return rows
}

function telaEpic(row) {
    let rows = []
    epicAtual = config.epic
    row.addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('epic')
            .setOptions([
                {
                    label: 'Diário',
                    value: 'D',
                    default: epicAtual == 'D' ? true : false,
                },
                {
                    label: 'Semanal',
                    value: 'S',
                    default: epicAtual == 'S' ? true : false,
                }
            ])
    )

    rows.push(row)

    row = new ActionRowBuilder()

    row.addComponents(
        new ButtonBuilder()
            .setCustomId('btnTesteEpic')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Testar serviço')
            .setDisabled(false),
        new ButtonBuilder()
            .setCustomId('btnVoltar')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Voltar')
            .setDisabled(false)
    )

    rows.push(row)

    return rows
}

function telaPrime(row) {
    let rows = []
    primeAtual = config.prime
    row.addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('prime')
            .setOptions([
                {
                    label: 'Mensal',
                    value: 'M',
                    default: primeAtual == 'M' ? true : false,
                },
                {
                    label: 'Semanal',
                    value: 'S',
                    default: primeAtual == 'S' ? true : false,
                }
            ])
    )

    rows.push(row)

    row = new ActionRowBuilder()

    row.addComponents(
        new ButtonBuilder()
            .setCustomId('btnTestePrime')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Testar serviço')
            .setDisabled(false),
        new ButtonBuilder()
            .setCustomId('btnVoltar')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Voltar')
            .setDisabled(false)
    )

    rows.push(row)

    return rows
}

async function telaSteamIDs(row) {
    let rows = []
    let steamIds = await carregaSteamIds()
    let options = []
    steamIds.forEach((id, key) => {
        options.push({
            label: `${id.steamId}`,
            value: `${key < 0 ? 0 : ''}${key}`,
            default: id.status
        })
    })
    row.addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('steamIds')
            .setMaxValues(options.length)
            .setOptions(options)
    )

    rows.push(row)

    row = new ActionRowBuilder()

    row.addComponents(
        new ButtonBuilder()
            .setCustomId('btnVoltar')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Voltar')
            .setDisabled(false)
    )

    rows.push(row)

    return rows
}

function telaSalvar(row) {
    let rows = []
    row.addComponents(
        new ButtonBuilder()
            .setCustomId('btnSalvarCont')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Salvar e continuar')
            .setDisabled(false),
        new ButtonBuilder()
            .setCustomId('btnSalvarSair')
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Salvar e sair')
            .setDisabled(false)
    )

    rows.push(row)

    return rows
}
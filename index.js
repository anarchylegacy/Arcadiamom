const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, UserSelectMenuBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Painel com Seleção por @ Online!"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIXO = "!"; 

client.on("ready", () => {
  console.log(`✅ ${client.user.tag} pronto! Seleção por @ ativa.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === `${PREFIXO}painel`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("❌ Apenas membros da Staff podem acessar o painel.");
    }

    const embedMenu = new EmbedBuilder()
      .setTitle("🛡️ KAMIMOD — MENU PRINCIPAL")
      .setDescription("Selecione abaixo qual categoria de ferramentas você deseja abrir neste canal.")
      .setColor("#2f3136");

    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_chat_aba").setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_punir_aba").setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embedMenu], components: [rowMenu] });
  }
});

// Interações do Painel (Botões e Menus de Seleção)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isUserSelectMenu()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
    return interaction.reply({ content: "❌ Você não tem permissão para usar este painel.", ephemeral: true });
  }

  // --- 1. SE FOR ENTRADA DO MENU DE SELEÇÃO DE USUÁRIO (@) ---
  if (interaction.isUserSelectMenu()) {
    if (interaction.customId === "select_user_punir") {
      const alvoId = interaction.values[0]; // Captura o ID do usuário selecionado pelo @

      const embedPunir = new EmbedBuilder()
        .setTitle("🔨 KAMIMOD — CENTRAL DE PUNIÇÕES")
        .setDescription(`Gerenciando o usuário: <@${alvoId}> \nID: \`${alvoId}\``)
        .setColor("#e74c3c");

      const rowUser1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`usr_ban_${alvoId}`).setLabel("Banir 🔨").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`usr_kick_${alvoId}`).setLabel("Expulsar 🦶").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`usr_unban_${alvoId}`).setLabel("Desbanir 🔓").setStyle(ButtonStyle.Success)
      );

      const rowUser2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`usr_mute_${alvoId}`).setLabel("Mutar 🔇").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`usr_unmute_${alvoId}`).setLabel("Desmutar 🔊").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`usr_purge_${alvoId}`).setLabel("Limpar Mensagens 🧹").setStyle(ButtonStyle.Secondary)
      );

      const rowUser3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`usr_nick_${alvoId}`).setLabel("Trocar Apelido 📝").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`usr_info_${alvoId}`).setLabel("Ver Info ℹ️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
      );

      return await interaction.update({ embeds: [embedPunir], components: [rowUser1, rowUser2, rowUser3] });
    }
  }

  // --- 2. SE FOR INTERAÇÃO DE BOTÕES ---
  if (interaction.isButton()) {
    const idFatiado = interaction.customId.split("_");
    const categoria = idFatiado[0];
    const acao = idFatiado[1];
    const alvoId = idFatiado[2];

    // Abrir aba de Chat
    if (categoria === "menu" && acao === "chat") {
      const embedChat = new EmbedBuilder()
        .setTitle("💬 KAMIMOD — CENTRAL DO CHAT")
        .setDescription("Ferramentas de controle e limpeza do canal de texto atual.")
        .setColor("#3498db");

      const rowChat = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("chat_lock_").setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("chat_unlock_").setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("chat_clear_").setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
      );

      return await interaction.update({ embeds: [embedChat], components: [rowChat] });
    }

    // Clicou em Punir -> Altera o painel para exibir a lista de escolha por @
    if (categoria === "menu" && acao === "punir") {
      const embedSelect = new EmbedBuilder()
        .setTitle("👤 SELECIONE O MEMBRO")
        .setDescription("Abra o menu de seleção abaixo e escolha quem você deseja punir por `@`.")
        .setColor("#e67e22");

      const selectMenu = new UserSelectMenuBuilder()
        .setCustomId("select_user_punir")
        .setPlaceholder("Selecione o usuário aqui...")
        .setMinValues(1)
        .setMaxValues(1);

      const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
      const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
      );

      return await interaction.update({ embeds: [embedSelect], components: [rowSelect, rowVoltar] });
    }

    // Voltar ao menu principal
    if (categoria === "menu" && acao === "voltar") {
      const embedMenu = new EmbedBuilder()
        .setTitle("🛡️ KAMIMOD — MENU PRINCIPAL")
        .setDescription("Selecione abaixo qual categoria de ferramentas você deseja abrir neste canal.")
        .setColor("#2f3136");

      const rowMenu = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_chat_aba").setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("menu_punir_aba").setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger)
      );

      return await interaction.update({ embeds: [embedMenu], components: [rowMenu] });
    }

    // Execuções das ações do Chat
    if (categoria === "chat" && acao === "lock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      return interaction.reply("🔒 Canal trancado.");
    }
    if (categoria === "chat" && acao === "unlock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      return interaction.reply("🔓 Canal aberto.");
    }
    if (categoria === "chat" && acao === "clear") {
      const msgs = await interaction.channel.messages.fetch({ limit: 50 });
      await interaction.channel.bulkDelete(msgs, true);
      return interaction.reply({ content: "🧹 Chat limpo.", ephemeral: true });
    }

    // Execuções das ações de Moderação de Usuário
    const membroAlvo = alvoId ? await interaction.guild.members.fetch(alvoId).catch(() => null) : null;

    if (categoria === "usr" && acao === "ban") {
      await interaction.guild.bans.create(alvoId, { reason: "Painel por Seleção @" })
        .then(() => interaction.reply(`🔨 Usuário <@${alvoId}> banido.`))
        .catch(() => interaction.reply({ content: "❌ Erro ao banir.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "kick") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Membro fora do server.", ephemeral: true });
      await membroAlvo.kick("Painel por Seleção @")
        .then(() => interaction.reply(`🦶 <@${alvoId}> expulso.`))
        .catch(() => interaction.reply({ content: "❌ Erro ao expulsar.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "unban") {
      await interaction.guild.bans.remove(alvoId)
        .then(() => interaction.reply(`🔓 ID \`${alvoId}\` desbanido.`))
        .catch(() => interaction.reply({ content: "❌ ID não está banido.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "mute") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Membro fora do server.", ephemeral: true });
      await membroAlvo.timeout(60 * 60 * 1000, "Painel por Seleção @")
        .then(() => interaction.reply(`🔇 <@${alvoId}> mutado por 1 hora.`))
        .catch(() => interaction.reply({ content: "❌ Erro ao mutar.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "unmute") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Membro fora do server.", ephemeral: true });
      await membroAlvo.timeout(null)
        .then(() => interaction.reply(`🔊 Castigo de <@${alvoId}> removido.`))
        .catch(() => interaction.reply({ content: "❌ O usuário não estava mutado.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "purge") {
      const todasMsgs = await interaction.channel.messages.fetch({ limit: 100 });
      const msgsDoAlvo = todasMsgs.filter(m => m.author.id === alvoId);
      if (msgsDoAlvo.size === 0) return interaction.reply({ content: "🧹 Nenhuma mensagem desse usuário encontrada.", ephemeral: true });
      await interaction.channel.bulkDelete(msgsDoAlvo, true);
      return interaction.reply({ content: `🧹 Mensagens de <@${alvoId}> limpas do chat.`, ephemeral: true });
    }
    if (categoria === "usr" && acao === "nick") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Membro fora do server.", ephemeral: true });
      await membroAlvo.setNickname("⚙️ Nome Alterado")
        .then(() => interaction.reply(`📝 Apelido de <@${alvoId}> resetado/alterado.`))
        .catch(() => interaction.reply({ content: "❌ Falta permissão de cargo.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "info") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Não encontrado no servidor.", ephemeral: true });
      const infoEmbed = new EmbedBuilder()
        .setTitle(`📋 Ficha do Usuário`)
        .setColor("#34495e")
        .setDescription(`**Tag:** ${membroAlvo.user.tag}\n**ID:** \`${membroAlvo.id}\``)
        .addFields({ name: "Cargos", value: membroAlvo.roles.cache.map(r => r.name).join(", ").replace(", @everyone", "") || "Nenhum" });
      return interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);

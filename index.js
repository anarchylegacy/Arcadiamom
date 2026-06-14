const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Painel por Categorias Online!"));
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
  console.log(`✅ ${client.user.tag} online! Menu Principal configurado.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // COMANDO: !painel ou !painel @usuario
  if (message.content.startsWith(`${PREFIXO}painel`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("❌ Apenas membros da Staff podem acessar o painel.");
    }

    const alvo = message.mentions.members.first();
    const alvoId = alvo ? alvo.id : "nenhum";

    const embedMenu = new EmbedBuilder()
      .setTitle("🛡️ KAMIMOD — MENU PRINCIPAL")
      .setDescription(
        "Selecione abaixo qual categoria de ferramentas você deseja abrir neste canal.\n\n" +
        `👤 **Alvo atual:** ${alvo ? `<@${alvo.id}>` : "*Nenhum usuário marcado (Use `!painel @usuario` para liberar punições)*"}`
      )
      .setColor("#2f3136");

    // Botões do Menu Principal (passando o ID do alvo junto no ID do botão)
    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`menu_chat_${alvoId}`).setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`menu_punir_${alvoId}`).setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embedMenu], components: [rowMenu] });
  }
});

// Interações dos Botões e Submenus
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
    return interaction.reply({ content: "❌ Você não tem permissão para usar este painel.", ephemeral: true });
  }

  const idFatiado = interaction.customId.split("_");
  const categoria = idFatiado[0]; // menu, chat, usr
  const acao = idFatiado[1];      // chat, punir, lock, ban, etc
  const alvoId = idFatiado[2];     // ID do usuário ou "nenhum"

  // 1. SELEÇÃO DO MENU: CATEGORIA APENAS CHAT
  if (categoria === "menu" && acao === "chat") {
    const embedChat = new EmbedBuilder()
      .setTitle("💬 KAMIMOD — CENTRAL DO CHAT")
      .setDescription("Ferramentas de controle e limpeza do canal de texto atual.")
      .setColor("#3498db");

    const rowChat = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`chat_lock_${alvoId}`).setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`chat_unlock_${alvoId}`).setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`chat_clear_${alvoId}`).setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`menu_voltar_${alvoId}`).setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
    );

    return await interaction.update({ embeds: [embedChat], components: [rowChat] });
  }

  // 2. SELEÇÃO DO MENU: CATEGORIA PUNIR
  if (categoria === "menu" && acao === "punir") {
    if (alvoId === "nenhum") {
      return interaction.reply({ content: "❌ Para acessar essa área, feche este painel e use: `!painel @usuario` marcando alguém.", ephemeral: true });
    }

    const embedPunir = new EmbedBuilder()
      .setTitle("🔨 KAMIMOD — CENTRAL DE PUNIÇÕES")
      .setDescription(`Aplique penalidades ou gerencie o perfil do usuário <@${alvoId}>.`)
      .setColor("#e74c3c");

    const rowUser1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_ban_${alvoId}`).setLabel("Banir 🔨").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`usr_kick_${alvoId}`).setLabel("Expulsar 🦶").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`usr_unban_${alvoId}`).setLabel("Desbanir 🔓").setStyle(ButtonStyle.Success)
    );

    const rowUser2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_mute_${alvoId}`).setLabel("Mutar 🔇").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`usr_unmute_${alvoId}`).setLabel("Desmutar 🔊").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`usr_purge_${alvoId}`).setLabel("Limpar Msg User 🧹").setStyle(ButtonStyle.Secondary)
    );

    const rowUser3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_nick_${alvoId}`).setLabel("Trocar Apelido 📝").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`usr_info_${alvoId}`).setLabel("Ver Info ℹ️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`menu_voltar_${alvoId}`).setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
    );

    return await interaction.update({ embeds: [embedPunir], components: [rowUser1, rowUser2, rowUser3] });
  }

  // 3. BOTAO VOLTAR AO MENU PRINCIPAL
  if (categoria === "menu" && acao === "voltar") {
    const embedMenu = new EmbedBuilder()
      .setTitle("🛡️ KAMIMOD — MENU PRINCIPAL")
      .setDescription(`Selecione abaixo qual categoria de ferramentas você deseja abrir neste canal.\n\n👤 **Alvo atual:** ${alvoId !== "nenhum" ? `<@${alvoId}>` : "*Nenhum*"}`)
      .setColor("#2f3136");

    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`menu_chat_${alvoId}`).setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`menu_punir_${alvoId}`).setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger)
    );

    return await interaction.update({ embeds: [embedMenu], components: [rowMenu] });
  }

  // ================= AÇÕES REAIS DOS BOTÕES DO SUBMENU =================

  // Ações de Chat
  if (categoria === "chat" && acao === "lock") {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    return interaction.reply("🔒 O canal foi trancado.");
  }
  if (categoria === "chat" && acao === "unlock") {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
    return interaction.reply("🔓 O canal foi aberto.");
  }
  if (categoria === "chat" && acao === "clear") {
    const msgs = await interaction.channel.messages.fetch({ limit: 50 });
    await interaction.channel.bulkDelete(msgs, true);
    return interaction.reply({ content: "🧹 Chat limpo.", ephemeral: true });
  }

  // Ações de Usuário
  const membroAlvo = alvoId !== "nenhum" ? await interaction.guild.members.fetch(alvoId).catch(() => null) : null;

  if (categoria === "usr" && acao === "ban") {
    await interaction.guild.bans.create(alvoId, { reason: "Menu KamiMod" })
      .then(() => interaction.reply(`🔨 ID \`${alvoId}\` banido com sucesso.`))
      .catch(() => interaction.reply({ content: "❌ Erro ao banir.", ephemeral: true }));
  }
  if (categoria === "usr" && acao === "kick") {
    if (!membroAlvo) return interaction.reply({ content: "❌ Membro fora do servidor.", ephemeral: true });
    await membroAlvo.kick("Menu KamiMod")
      .then(() => interaction.reply(`🦶 <@${alvoId}> expulso.`))
      .catch(() => interaction.reply({ content: "❌ Erro ao expulsar.", ephemeral: true }));
  }
  if (categoria === "usr" && acao === "unban") {
    await interaction.guild.bans.remove(alvoId)
      .then(() => interaction.reply(`🔓 ID \`${alvoId}\` desbanido.`))
      .catch(() => interaction.reply({ content: "❌ Não está banido.", ephemeral: true }));
  }
  if (categoria === "usr" && acao === "mute") {
    if (!membroAlvo) return interaction.reply({ content: "❌ Membro fora do servidor.", ephemeral: true });
    await membroAlvo.timeout(60 * 60 * 1000, "Menu KamiMod")
      .then(() => interaction.reply(`🔇 <@${alvoId}> silenciado por 1 hora.`))
      .catch(() => interaction.reply({ content: "❌ Erro ao mutar.", ephemeral: true }));
  }
  if (categoria === "usr" && acao === "unmute") {
    if (!membroAlvo) return interaction.reply({ content: "❌ Membro fora do servidor.", ephemeral: true });
    await membroAlvo.timeout(null)
      .then(() => interaction.reply(`🔊 Castigo de <@${alvoId}> retirado.`))
      .catch(() => interaction.reply({ content: "❌ Não estava mutado.", ephemeral: true }));
  }
  if (categoria === "usr" && acao === "purge") {
    const todasMsgs = await interaction.channel.messages.fetch({ limit: 100 });
    const msgsDoAlvo = todasMsgs.filter(m => m.author.id === alvoId);
    if (msgsDoAlvo.size === 0) return interaction.reply({ content: "🧹 Nenhuma mensagem desse usuário encontrada.", ephemeral: true });
    await interaction.channel.bulkDelete(msgsDoAlvo, true);
    return interaction.reply({ content: `🧹 Mensagens de <@${alvoId}> apagadas.`, ephemeral: true });
  }
  if (categoria === "usr" && acao === "nick") {
    if (!membroAlvo) return interaction.reply({ content: "❌ Membro fora do servidor.", ephemeral: true });
    await membroAlvo.setNickname("⚙️ Nome Alterado")
      .then(() => interaction.reply(`📝 Apelido alterado.`))
      .catch(() => interaction.reply({ content: "❌ Erro de permissão de cargo.", ephemeral: true }));
  }
  if (categoria === "usr" && acao === "info") {
    if (!membroAlvo) return interaction.reply({ content: "❌ Não encontrado.", ephemeral: true });
    const infoEmbed = new EmbedBuilder()
      .setTitle(`📋 Informações: ${membroAlvo.user.username}`)
      .setColor("#34495e")
      .addFields({ name: "Cargos", value: membroAlvo.roles.cache.map(r => r.name).join(", ").replace(", @everyone", "") || "Nenhum" });
    return interaction.reply({ embeds: [infoEmbed], ephemeral: true });
  }
});

client.login(process.env.TOKEN);

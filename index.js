const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Painel com Modais Online!"));
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
  console.log(`✅ ${client.user.tag} pronto! Sistema de janelas interativas ativo.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Agora basta digitar apenas !painel (não precisa marcar ninguém aqui)
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

// Interações do Botão e envio de Janelas (Modais)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return;

  // Trava de Staff
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
    return interaction.reply({ content: "❌ Você não tem permissão para usar este painel.", ephemeral: true });
  }

  // --- SE TRATANDO DE CLIQUES EM BOTÕES ---
  if (interaction.isButton()) {
    const idFatiado = interaction.customId.split("_");
    const categoria = idFatiado[0];
    const acao = idFatiado[1];
    const alvoId = idFatiado[2];

    // 1. Abrir aba de Chat
    if (categoria === "menu" && acao === "chat") {
      const embedChat = new EmbedBuilder()
        .setTitle("💬 KAMIMOD — CENTRAL DO CHAT")
        .setDescription("Ferramentas de controle e limpeza do canal atual.")
        .setColor("#3498db");

      const rowChat = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("chat_lock_").setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("chat_unlock_").setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("chat_clear_").setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
      );

      return await interaction.update({ embeds: [embedChat], components: [rowChat] });
    }

    // 2. Clicou em Punir -> Abre a Janelinha para digitar o ID
    if (categoria === "menu" && acao === "punir") {
      const modal = new ModalBuilder()
        .setCustomId("modal_pundata")
        .setTitle("Configurar Punição");

      const idInput = new TextInputBuilder()
        .setCustomId("input_userid")
        .setLabel("Digite o ID do Usuário:")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ex: 1515103863454040164")
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(idInput));
      return await interaction.showModal(modal);
    }

    // 3. Voltar ao menu iniciar
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

    // Ações do Chat
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

    // Ações Reais de Moderação (Executadas após abrir o painel do ID)
    const membroAlvo = alvoId ? await interaction.guild.members.fetch(alvoId).catch(() => null) : null;

    if (categoria === "usr" && acao === "ban") {
      await interaction.guild.bans.create(alvoId, { reason: "Painel Dinâmico" })
        .then(() => interaction.reply(`🔨 ID \`${alvoId}\` banido.`))
        .catch(() => interaction.reply({ content: "❌ Erro ao banir.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "kick") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Usuário fora do server.", ephemeral: true });
      await membroAlvo.kick("Painel Dinâmico")
        .then(() => interaction.reply(`🦶 <@${alvoId}> expulso.`))
        .catch(() => interaction.reply({ content: "❌ Erro ao expulsar.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "unban") {
      await interaction.guild.bans.remove(alvoId)
        .then(() => interaction.reply(`🔓 ID \`${alvoId}\` desbanido.`))
        .catch(() => interaction.reply({ content: "❌ Não encontrado nos banidos.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "mute") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Fora do server.", ephemeral: true });
      await membroAlvo.timeout(60 * 60 * 1000, "Painel Dinâmico")
        .then(() => interaction.reply(`🔇 <@${alvoId}> mutado por 1 hora.`))
        .catch(() => interaction.reply({ content: "❌ Erro ao mutar.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "unmute") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Fora do server.", ephemeral: true });
      await membroAlvo.timeout(null)
        .then(() => interaction.reply(`🔊 Castigo de <@${alvoId}> removido.`))
        .catch(() => interaction.reply({ content: "❌ Não estava mutado.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "purge") {
      const todasMsgs = await interaction.channel.messages.fetch({ limit: 100 });
      const msgsDoAlvo = todasMsgs.filter(m => m.author.id === alvoId);
      if (msgsDoAlvo.size === 0) return interaction.reply({ content: "🧹 Nenhuma mensagem dele encontrada.", ephemeral: true });
      await interaction.channel.bulkDelete(msgsDoAlvo, true);
      return interaction.reply({ content: `🧹 Mensagens de <@${alvoId}> apagadas.`, ephemeral: true });
    }
    if (categoria === "usr" && acao === "nick") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Fora do server.", ephemeral: true });
      await membroAlvo.setNickname("⚙️ Nome Alterado")
        .then(() => interaction.reply(`📝 Apelido alterado.`))
        .catch(() => interaction.reply({ content: "❌ Erro nos cargos.", ephemeral: true }));
    }
    if (categoria === "usr" && acao === "info") {
      if (!membroAlvo) return interaction.reply({ content: "❌ Não encontrado.", ephemeral: true });
      const infoEmbed = new EmbedBuilder()
        .setTitle(`📋 Ficha de: ${membroAlvo.user.username}`)
        .setColor("#34495e")
        .addFields({ name: "Cargos", value: membroAlvo.roles.cache.map(r => r.name).join(", ").replace(", @everyone", "") || "Nenhum" });
      return interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    }
  }

  // --- SE TRATANDO DO RECEBIMENTO DA JANELINHA (MODAL) ---
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "modal_pundata") {
      const alvoId = interaction.fields.getTextInputValue("input_userid").trim();

      // Monta o painel de ações injetando o ID coletado da caixinha nos botões
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

      // Atualiza a mensagem mostrando o painel de punições configurado para aquele ID!
      return await interaction.update({ embeds: [embedPunir], components: [rowUser1, rowUser2, rowUser3] });
    }
  }
});

client.login(process.env.TOKEN);

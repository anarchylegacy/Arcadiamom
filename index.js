const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, ChannelType } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Painel Geral com IA Integrada Ativo!"));
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
  console.log(`✅ ${client.user.tag} online! Menu unificado com Atendimento IA ativo.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // --- SISTEMA DE RESPOSTAS CERTAS DA IA BASEADO NO QUE O USER DIGITA ---
  if (message.channel.name.startsWith("🤖-ia-")) {
    await message.channel.sendTyping();
    
    setTimeout(async () => {
      const textoUser = message.content.toLowerCase();
      let respostaCerta = "Analisei sua dúvida, mas não encontrei uma palavra-chave específica. Por favor, aguarde um Administrador da Staff para te dar suporte humano!";

      // Verifica o que o usuário quer e responde certinho:
      if (textoUser.includes("vip") || textoUser.includes("comprar") || textoUser.includes("loja")) {
        respostaCerta = "📢 **Sobre Compras e VIP:** Acesse a nossa loja oficial ou o canal de anúncios para conferir as vantagens e preços. Lembre-se de enviar o comprovante aqui se já realizou o pagamento!";
      } else if (textoUser.includes("bug") || textoUser.includes("erro") || textoUser.includes("travado")) {
        respostaCerta = "⚙️ **Reportar Erros:** Entendido! Para que a nossa equipe de desenvolvedores conserte isso rápido, digite aqui o passo a passo de como o bug aconteceu e anexe prints se tiver.";
      } else if (textoUser.includes("entrar") || textoUser.includes("ip") || textoUser.includes("conexao") || textoUser.includes("versao")) {
        respostaCerta = "🎮 **Problemas para Entrar:** Verifique se você está utilizando a versão exata exigida pelo servidor e se o seu launcher está atualizado. Caso use mods, certifique-se de que estão na pasta correta.";
      } else if (textoUser.includes("regra") || textoUser.includes("ban") || textoUser.includes("revisao")) {
        respostaCerta = "⚖️ **Diretrizes e Revisões:** O respeito mútuo é obrigatório. Se você veio contestar uma punição, escreva sua justificativa com provas concretas e aguarde a análise da diretoria.";
      }

      const embedIA = new EmbedBuilder()
        .setTitle("🤖 RESPOSTA PRE PRECISA DA IA")
        .setDescription(respostaCerta)
        .setFooter({ text: "KamiMod Inteligente — Resposta Direcionada" })
        .setColor("#9b59b6");

      await message.channel.send({ embeds: [embedIA] });
    }, 1500);
    return;
  }

  // COMANDO ÚNICO COM TODAS AS OPÇÕES
  if (message.content === `${PREFIXO}painel`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

    const embedMenu = new EmbedBuilder()
      .setTitle("🛡️ KAMIMOD — MENU CENTRAL DE GERENCIAMENTO")
      .setDescription("Escolha uma das abas abaixo para carregar as ferramentas no chat:")
      .setColor("#2f3136");

    // Menu Principal com as 3 opções solicitadas
    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_chat_aba").setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_punir_aba").setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("menu_ia_aba").setLabel("Atendimento com IA 🤖").setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ embeds: [embedMenu], components: [rowMenu] });
  }
});

// Processamento de cliques e botões
client.on("interactionCreate", async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("modal_nick_")) {
      const alvoId = interaction.customId.split("_")[2];
      const novoNick = interaction.fields.getTextInputValue("input_newnick");
      const membroAlvo = await interaction.guild.members.fetch(alvoId).catch(() => null);

      if (!membroAlvo) return interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
      await membroAlvo.setNickname(novoNick)
        .then(() => interaction.reply(`📝 Apelido de <@${alvoId}> alterado para: **${novoNick}**.`))
        .catch(() => interaction.reply({ content: "❌ Erro de hierarquia de cargos do bot.", ephemeral: true }));
    }
    return;
  }

  if (!interaction.isButton() && !interaction.isUserSelectMenu()) return;

  const idFatiado = interaction.customId.split("_");
  const categoria = idFatiado[0];
  const acao = idFatiado[1];
  const alvoId = idFatiado[2];

  // --- BOTÃO DA ABA DE CHAT ---
  if (categoria === "menu" && acao === "chat") {
    const embedChat = new EmbedBuilder()
      .setTitle("💬 KAMIMOD — CENTRAL DO CHAT")
      .setDescription("Opções de moderação para o canal de texto.")
      .setColor("#3498db");

    const rowChat = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("chat_lock_").setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("chat_unlock_").setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("chat_clear_").setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
    );
    return await interaction.update({ embeds: [embedChat], components: [rowChat] });
  }

  // --- BOTÃO DA ABA DE PUNIÇÃO (POR DROPDOWN @) ---
  if (categoria === "menu" && acao === "punir") {
    const embedSelect = new EmbedBuilder()
      .setTitle("👤 SELECIONE O MEMBRO")
      .setDescription("Selecione quem você quer gerenciar no menu de usuários abaixo.")
      .setColor("#e67e22");

    const selectMenu = new UserSelectMenuBuilder().setCustomId("select_user_punir").setPlaceholder("Procure o usuário por @...");
    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
    const rowVoltar = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
    );
    return await interaction.update({ embeds: [embedSelect], components: [rowSelect, rowVoltar] });
  }

  // --- NOVA ABA: CRIAR ATENDIMENTO COM IA ---
  if (categoria === "menu" && acao === "ia") {
    const embedIABox = new EmbedBuilder()
      .setTitle("🤖 CENTRAL DE SUPORTE — IA")
      .setDescription("Deseja criar uma sala de suporte gerenciada por Inteligência Artificial para os usuários?")
      .setColor("#9b59b6");

    const rowIABtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ia_abrir_canal").setLabel("Iniciar Chat com IA 🚀").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
    );
    return await interaction.update({ embeds: [embedIABox], components: [rowIABtn] });
  }

  // --- BOTÃO VOLTAR ---
  if (categoria === "menu" && acao === "voltar") {
    const embedMenu = new EmbedBuilder()
      .setTitle("🛡️ KAMIMOD — MENU CENTRAL DE GERENCIAMENTO")
      .setDescription("Escolha uma das abas abaixo para carregar as ferramentas no chat:")
      .setColor("#2f3136");

    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_chat_aba").setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_punir_aba").setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("menu_ia_aba").setLabel("Atendimento com IA 🤖").setStyle(ButtonStyle.Success)
    );
    return await interaction.update({ embeds: [embedMenu], components: [rowMenu] });
  }

  // --- GERAÇÃO DA SALA DE IA APÓS CONFIRMAÇÃO ---
  if (interaction.customId === "ia_abrir_canal") {
    const nomeSalaIA = `🤖-ia-${interaction.user.username}`;
    const salaExiste = interaction.guild.channels.cache.find(c => c.name === nomeSalaIA.toLowerCase());
    if (salaExiste) return interaction.reply({ content: `❌ Você já possui um chat com a IA ativo em <#${salaExiste.id}>.`, ephemeral: true });

    const canalIA = await interaction.guild.channels.create({
      name: nomeSalaIA,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    const embedWelcomeIA = new EmbedBuilder()
      .setTitle("🤖 ATENDIMENTO INTELIGENTE")
      .setDescription("Olá! Digite sua pergunta sobre **VIP, BUGS, ERROS DE CONEXÃO ou REGRAS** que eu vou processar e te dar a resposta certa agora mesmo!")
      .setColor("#9b59b6");

    const rowFecharIA = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ia_fechar_canal").setLabel("Fechar Atendimento ❌").setStyle(ButtonStyle.Danger)
    );

    await canalIA.send({ embeds: [embedWelcomeIA], components: [rowFecharIA] });
    return interaction.reply({ content: `✅ Sala de atendimento criada em <#${canalIA.id}>!`, ephemeral: true });
  }

  if (interaction.customId === "ia_fechar_canal") {
    await interaction.reply("🔒 Canal encerrado. Deletando em 5 segundos...");
    return setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }

  // --- ATUALIZAÇÃO DO MENU SELEÇÃO DE USER @ ---
  if (interaction.isUserSelectMenu() && interaction.customId === "select_user_punir") {
    const selectedId = interaction.values[0];
    const embedPunir = new EmbedBuilder().setTitle("🔨 CONTROLE DO MEMBRO").setDescription(`Aplicar ações em: <@${selectedId}>`).setColor("#e74c3c");

    const r1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_ban_${selectedId}`).setLabel("Banir 🔨").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`usr_kick_${selectedId}`).setLabel("Expulsar 🦶").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`usr_unban_${selectedId}`).setLabel("Desbanir 🔓").setStyle(ButtonStyle.Success)
    );
    const r2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_mute_${selectedId}`).setLabel("Mutar 🔇").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`usr_unmute_${selectedId}`).setLabel("Desmutar 🔊").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`usr_purge_${selectedId}`).setLabel("Limpar Mensagens 🧹").setStyle(ButtonStyle.Secondary)
    );
    const r3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_nick_${selectedId}`).setLabel("Trocar Apelido 📝").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`usr_info_${selectedId}`).setLabel("Ver Info ℹ️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
    );
    return await interaction.update({ embeds: [embedPunir], components: [r1, r2, r3] });
  }

  // --- EXECUÇÕES DAS AÇÕES DOS SUBMENUS ---
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
    return interaction.reply({ content: "🧹 Mensagens limpas.", ephemeral: true });
  }

  // Ações de Membros
  const membroAlvo = alvoId ? await interaction.guild.members.fetch(alvoId).catch(() => null) : null;

  if (categoria === "usr" && acao === "ban") {
    await interaction.guild.bans.create(alvoId).then(() => interaction.reply("🔨 Banido.")).catch(() => interaction.reply("❌ Erro ao banir."));
  }
  if (categoria === "usr" && acao === "kick") {
    if (membroAlvo) await membroAlvo.kick().then(() => interaction.reply("🦶 Expulso."));
  }
  if (categoria === "usr" && acao === "mute") {
    if (membroAlvo) await membroAlvo.timeout(60 * 60 * 1000).then(() => interaction.reply("🔇 Mutado por 1 hora."));
  }
  if (categoria === "usr" && acao === "unmute") {
    if (membroAlvo) await membroAlvo.timeout(null).then(() => interaction.reply("🔊 Desmutado."));
  }
  if (categoria === "usr" && acao === "purge") {
    const m = await interaction.channel.messages.fetch({ limit: 100 });
    await interaction.channel.bulkDelete(m.filter(msg => msg.author.id === alvoId), true);
    return interaction.reply({ content: "🧹 Mensagens limpas.", ephemeral: true });
  }
  if (categoria === "usr" && acao === "info") {
    if (!membroAlvo) return;
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle("📋 Info").setDescription(`**Tag:** ${membroAlvo.user.tag}`)], ephemeral: true });
  }

  // Modal do Trocar Apelido Ativado por aqui
  if (categoria === "usr" && acao === "nick") {
    const modalNick = new ModalBuilder().setCustomId(`modal_nick_${alvoId}`).setTitle("Mudar Apelido");
    const input = new TextInputBuilder().setCustomId("input_newnick").setLabel("Qual o novo apelido?").setStyle(TextInputStyle.Short).setRequired(true);
    modalNick.addComponents(new ActionRowBuilder().addComponents(input));
    return await interaction.showModal(modalNick);
  }
});

client.login(process.env.TOKEN);

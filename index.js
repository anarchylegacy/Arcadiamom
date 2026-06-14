const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, ChannelType, StringSelectMenuBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Central de Tickets com Categoria IA Online!"));
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

// Banco de dados de respostas da IA
const respostasIAAtendimento = [
  "📢 **Dúvidas sobre VIP ou Compras:** Para agilizar seu atendimento, envie o seu nick e o comprovante de pagamento aqui no chat. Um Diretor fará a entrega manual assim que visualizar!",
  "⚙️ **Reportar Erros ou Bugs:** Detalhe o problema explicando o passo a passo de como ele acontece. Se tiver prints ou vídeos do erro, anexe aqui para ajudar nossos desenvolvedores.",
  "🎮 **Problemas de Conexão ou IP:** Verifique se você está utilizando a versão exata do servidor em seu launcher. Certifique-se também de que o seu Java está totalmente atualizado.",
  "⚖️ **Denúncias ou Revisão de Ban:** Mantenha a calma e envie sua justificativa acompanhada de provas concretas (imagens ou vídeos). A diretoria analisará o seu caso em breve."
];

client.on("ready", () => {
  console.log(`✅ ${client.user.tag} online! Sistema de Categorias com IA Integrada.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // --- LEITURA DA IA DENTRO DOS CANAIS DE TICKET ---
  if (message.channel.name.startsWith("🎫-ticket-") || message.channel.name.startsWith("🤖-ia-")) {
    await message.channel.sendTyping();
    
    setTimeout(async () => {
      const textoUser = message.content.toLowerCase();
      let respostaCerta = "Analisei a sua mensagem. Para dúvidas complexas ou ações internas, por favor, aguarde um Administrador humano assumir o seu chamado!";

      if (textoUser.includes("vip") || textoUser.includes("comprar") || textoUser.includes("loja")) {
        respostaCerta = respostasIAAtendimento[0];
      } else if (textoUser.includes("bug") || textoUser.includes("erro") || textoUser.includes("travado")) {
        respostaCerta = respostasIAAtendimento[1];
      } else if (textoUser.includes("entrar") || textoUser.includes("ip") || textoUser.includes("conexao")) {
        respostaCerta = respostasIAAtendimento[2];
      } else if (textoUser.includes("regra") || textoUser.includes("ban") || textoUser.includes("revisao") || textoUser.includes("denuncia")) {
        respostaCerta = respostasIAAtendimento[3];
      }

      const embedIA = new EmbedBuilder()
        .setTitle("🤖 ASSISTENTE VIRTUAL (IA)")
        .setDescription(respostaCerta)
        .setFooter({ text: "Atendimento Automático Inteligente" })
        .setColor("#9b59b6");

      await message.channel.send({ embeds: [embedIA] });
    }, 1500);
    return;
  }

  // COMANDO s!etup-ticket (Painel de Categorias contendo a Opção de IA)
  if (message.content === "s!etup-ticket") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const embedSetup = new EmbedBuilder()
      .setTitle("📩 CENTRAL DE ATENDIMENTO")
      .setDescription("Selecione a categoria do seu problema no menu suspenso abaixo para abrir um chamado privado.\n\n🤖 Se deseja apenas tirar dúvidas rápidas sem chamar a Staff, escolha a opção **Atendimento com IA**.")
      .setFooter({ text: "Suporte Técnico — Arcadiamon" })
      .setColor("#1abc9c");

    // Menu Dropdown com as categorias padrão + a categoria de Atendimento IA
    const selectTicket = new StringSelectMenuBuilder()
      .setCustomId("select_categoria_ticket")
      .setPlaceholder("Selecione o motivo do suporte...")
      .addOptions([
        { label: "Atendimento com IA 🤖", description: "Fale diretamente com nossa inteligência artificial para dúvidas rápidas", value: "Atendimento IA" },
        { label: "Suporte Geral 💬", description: "Dúvidas gerais com a equipe de Staff", value: "Suporte Geral" },
        { label: "Financeiro / VIP 💰", description: "Problemas com compras, doações ou ativações", value: "Financeiro" },
        { label: "Reportar Bugs ⚙️", description: "Erros técnicos encontrados no jogo ou servidor", value: "Bugs" },
        { label: "Denúncias e Revisões ⚖️", description: "Contestar punições ou reportar jogadores", value: "Denúncias" }
      ]);

    const rowSelect = new ActionRowBuilder().addComponents(selectTicket);

    await message.channel.send({ embeds: [embedSetup], components: [rowSelect] });
    await message.delete().catch(() => {});
  }

  // COMANDO !painel (Moderação da Staff)
  if (message.content === `${PREFIXO}painel`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

    const embedMenu = new EmbedBuilder()
      .setTitle("🛡️ KAMIMOD — MENU CENTRAL")
      .setDescription("Selecione uma das opções abaixo para carregar as ferramentas administrativas:")
      .setColor("#2f3136");

    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_chat_aba").setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_punir_aba").setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embedMenu], components: [rowMenu] });
  }
});

// Interações de Menus, Cliques e Modais
client.on("interactionCreate", async (interaction) => {
  
  // Modal de Apelido
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

  // --- SELEÇÃO DE CATEGORIA DE TICKET (DROPDOWN) ---
  if (interaction.isStringSelectMenu() && interaction.customId === "select_categoria_ticket") {
    const categoriaEscolhida = interaction.values[0];
    
    // Define o prefixo do nome do canal dependendo se escolheu IA ou Staff
    const prefixoCanal = categoriaEscolhida === "Atendimento IA" ? "🤖-ia-" : "🎫-ticket-";
    const nomeCanal = `${prefixoCanal}${interaction.user.username}`;
    
    const canalExiste = interaction.guild.channels.cache.find(c => c.name === nomeCanal.toLowerCase());
    if (canalExiste) {
      return interaction.reply({ content: `❌ Você já possui um canal de atendimento aberto em <#${canalExiste.id}>.`, ephemeral: true });
    }

    // Cria o canal focado e privado
    const canalTicket = await interaction.guild.channels.create({
      name: nomeCanal,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    // Configura o visual da mensagem interna baseado no tipo escolhido
    let descricaoEmbed = `Olá <@${interaction.user.id}>! Seu ticket focado em **${categoriaEscolhida}** foi aberto.\n\nDescreva seu problema enquanto a equipe é notificada!`;
    let corEmbed = "#1abc9c";

    if (categoriaEscolhida === "Atendimento IA") {
      descricaoEmbed = `Olá <@${interaction.user.id}>! Este é o seu espaço exclusivo de **Atendimento com Inteligência Artificial**.\n\n✍️ **Como funciona:** Digite qualquer dúvida sobre VIP, Bugs, Regras ou Erros aqui abaixo. Eu irei processar o texto e te responder instantaneamente!`;
      corEmbed = "#9b59b6";
    }

    const embedTicket = new EmbedBuilder()
      .setTitle(`🎫 CHAMADO INICIADO — ${categoriaEscolhida.toUpperCase()}`)
      .setDescription(descricaoEmbed)
      .setColor(corEmbed);

    const rowFechar = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_fechar_canal").setLabel("Fechar Atendimento 🔒").setStyle(ButtonStyle.Danger)
    );

    await canalTicket.send({ embeds: [embedTicket], components: [rowFechar] });
    return interaction.reply({ content: `✅ Canal criado com sucesso em <#${canalTicket.id}>!`, ephemeral: true });
  }

  if (!interaction.isButton() && !interaction.isUserSelectMenu()) return;

  // Fechar Canais (Ticket ou IA)
  if (interaction.customId === "ticket_fechar_canal") {
    await interaction.reply("🔒 Removendo esta sala em 5 segundos...");
    return setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }

  const idFatiado = interaction.customId.split("_");
  const categoria = idFatiado[0];
  const acao = idFatiado[1];
  const alvoId = idFatiado[2];

  // Controle de Abas Administrativas (!painel)
  if (categoria === "menu" && acao === "chat") {
    const embedChat = new EmbedBuilder().setTitle("💬 KAMIMOD — CENTRAL DO CHAT").setDescription("Opções de moderação para o canal de texto.").setColor("#3498db");
    const rowChat = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("chat_lock_").setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("chat_unlock_").setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("chat_clear_").setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary)
    );
    return await interaction.update({ embeds: [embedChat], components: [rowChat] });
  }

  if (categoria === "menu" && acao === "punir") {
    const embedSelect = new EmbedBuilder().setTitle("👤 SELECIONE O MEMBRO").setDescription("Selecione quem você quer gerenciar no menu de usuários abaixo.").setColor("#e67e22");
    const selectMenu = new UserSelectMenuBuilder().setCustomId("select_user_punir").setPlaceholder("Procure o usuário por @...");
    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
    const rowVoltar = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ao Menu ↩️").setStyle(ButtonStyle.Primary));
    return await interaction.update({ embeds: [embedSelect], components: [rowSelect, rowVoltar] });
  }

  if (categoria === "menu" && acao === "voltar") {
    const embedMenu = new EmbedBuilder().setTitle("🛡️ KAMIMOD — MENU CENTRAL").setDescription("Selecione uma das opções abaixo para carregar as ferramentas administrativas:").setColor("#2f3136");
    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_chat_aba").setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_punir_aba").setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger)
    );
    return await interaction.update({ embeds: [embedMenu], components: [rowMenu] });
  }

  // Painel de Moderação por @
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

  // Ações de Moderação de Chat
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

  // Ações de Moderação de Usuários
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
  if (categoria === "usr" && acao === "nick") {
    const modalNick = new ModalBuilder().setCustomId(`modal_nick_${alvoId}`).setTitle("Mudar Apelido");
    const input = new TextInputBuilder().setCustomId("input_newnick").setLabel("Qual o novo apelido?").setStyle(TextInputStyle.Short).setRequired(true);
    modalNick.addComponents(new ActionRowBuilder().addComponents(input));
    return await interaction.showModal(modalNick);
  }
});

client.login(process.env.TOKEN);

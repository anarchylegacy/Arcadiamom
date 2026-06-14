const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, ChannelType, StringSelectMenuBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Central de Tickets com IA Expandida Online!"));
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

// Banco de dados expandido com mais respostas contextuais da IA
const respostasIAAtendimento = {
  vip: "📢 **VIP, Compras e Loja:** Para consultar planos, métodos de pagamento ou registrar ativações, envie o seu nick e o comprovante aqui no chat. Um Diretor fará a entrega manual assim que visualizar!",
  bugs: "⚙️ **Bugs e Erros Técnicos:** Detalhe o problema explicando o passo a passo de como ele acontece. Se tiver prints ou vídeos do erro, anexe aqui para ajudar nossos programadores a resolverem mais rápido.",
  conexao: "🎮 **Conexão, IP e Versão:** Verifique se você está utilizando a versão exata do servidor em seu launcher. Certifique-se também de que seus mods estão na pasta correta e que o Java está atualizado.",
  regras: "⚖️ **Denúncias, Revisões e Regras:** Mantenha a calma e envie sua justificativa ou acusação acompanhada de provas concretas (links, prints ou vídeos). A diretoria analisará o caso em breve.",
  staff: "👑 **Falar com a Staff / Ajuda Geral:** Entendido! Se o seu problema não se encaixa nas opções automáticas, digite a sua dúvida detalhadamente aqui e aguarde um Administrador humano assumir o seu chamado.",
  Desempenho: "⚡ **Lag, Ping ou Queda de FPS:** Se você está enfrentando travamentos, verifique sua rota de internet ou tente alocar mais memória RAM no seu launcher. Se o servidor estiver instável, a nossa equipe técnica já estará trabalhando nisso!"
};

client.on("ready", () => {
  console.log(`✅ ${client.user.tag} online! IA atualizada com mais palavras-chave.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // --- LEITURA INTELIGENTE DA IA EXPANDIDA ---
  if (message.channel.name.startsWith("🎫-ticket-") || message.channel.name.startsWith("🤖-ia-")) {
    await message.channel.sendTyping();
    
    setTimeout(async () => {
      const msgUser = message.content.toLowerCase();
      let respostaFinal = "Analisei a sua mensagem. Para dúvidas complexas ou ações internas na conta, por favor, descreva seu problema detalhadamente e aguarde um Administrador humano assumir o chamado!";

      // Sistema avançado de checagem de novas palavras-chave
      if (msgUser.includes("vip") || msgUser.includes("comprar") || msgUser.includes("loja") || msgUser.includes("site") || msgUser.includes("pagar") || msgUser.includes("ativar")) {
        respostaFinal = respostasIAAtendimento.vip;
      } else if (msgUser.includes("bug") || msgUser.includes("erro") || msgUser.includes("travado") || msgUser.includes("sumiu") || msgUser.includes("problema")) {
        respostaFinal = respostasIAAtendimento.bugs;
      } else if (msgUser.includes("entrar") || msgUser.includes("ip") || msgUser.includes("conexao") || msgUser.includes("versao") || msgUser.includes("launcher") || msgUser.includes("minecraft")) {
        respostaFinal = respostasIAAtendimento.conexao;
      } else if (msgUser.includes("regra") || msgUser.includes("ban") || msgUser.includes("revisao") || msgUser.includes("denuncia") || msgUser.includes("hack") || msgUser.includes("xiter") || msgUser.includes("ofensa")) {
        respostaFinal = respostasIAAtendimento.regras;
      } else if (msgUser.includes("lag") || msgUser.includes("ping") || msgUser.includes("fps") || msgUser.includes("queda") || msgUser.includes("travando")) {
        respostaFinal = respostasIAAtendimento.Desempenho;
      } else if (msgUser.includes("staff") || msgUser.includes("ajuda") || msgUser.includes("suporte") || msgUser.includes("humano") || msgUser.includes("alguem") || msgUser.includes("admin")) {
        respostaFinal = respostasIAAtendimento.staff;
      }

      const embedIA = new EmbedBuilder()
        .setTitle("🤖 ASSISTENTE VIRTUAL (IA)")
        .setDescription(respostaFinal)
        .setFooter({ text: "Atendimento Automático Inteligente — KamiMod" })
        .setColor("#9b59b6");

      await message.channel.send({ embeds: [embedIA] });
    }, 1200);
    return;
  }

  // COMANDO s!etup-ticket
  if (message.content === "s!etup-ticket") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const embedSetup = new EmbedBuilder()
      .setTitle("📩 CENTRAL DE ATENDIMENTO")
      .setDescription("Selecione a categoria do seu problema no menu suspenso abaixo para abrir um chamado privado.\n\n🤖 Se deseja apenas tirar dúvidas rápidas com nosso sistema automatizado, escolha a opção **Atendimento com IA**.")
      .setFooter({ text: "Suporte Técnico — Arcadiamon" })
      .setColor("#1abc9c");

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

  // COMANDO !painel
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
        .catch(() => interaction.reply({ content: "❌ Erro de hierarquia do bot.", ephemeral: true }));
    }
    return;
  }

  // Seleção de Categoria de Ticket (Dropdown)
  if (interaction.isStringSelectMenu() && interaction.customId === "select_categoria_ticket") {
    const categoriaEscolhida = interaction.values[0];
    const prefixoCanal = categoriaEscolhida === "Atendimento IA" ? "🤖-ia-" : "🎫-ticket-";
    const nomeCanal = `${prefixoCanal}${interaction.user.username}`;
    
    const canalExiste = interaction.guild.channels.cache.find(c => c.name === nomeCanal.toLowerCase());
    if (canalExiste) {
      return interaction.reply({ content: `❌ Você já possui um canal de atendimento aberto em <#${canalExiste.id}>.`, ephemeral: true });
    }

    const canalTicket = await interaction.guild.channels.create({
      name: nomeCanal,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    let descricaoEmbed = `Olá <@${interaction.user.id}>! Seu ticket focado em **${categoriaEscolhida}** foi aberto.\n\nDescreva seu problema detalhadamente enquanto a equipe é notificada!`;
    let corEmbed = "#1abc9c";

    if (categoriaEscolhida === "Atendimento IA") {
      descricaoEmbed = `Olá <@${interaction.user.id}>! Este é o seu espaço de **Atendimento com Inteligência Artificial**.\n\n✍️ Digite qualquer dúvida sobre VIPs, Lojas, Bugs, Regras, Conexão ou problemas com Lag e FPS aqui abaixo. Eu responderei na hora!`;
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

  if (interaction.customId === "ticket_fechar_canal") {
    await interaction.reply("🔒 Removendo esta sala em 5 segundos...");
    return setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }

  const idFatiado = interaction.customId.split("_");
  const categoria = idFatiado[0];
  const acao = idFatiado[1];
  const alvoId = idFatiado[2];

  // Abas do !painel administrativo
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

  // Painel de Punição
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

  // Execuções do Chat
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

  // Execuções de Membros
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

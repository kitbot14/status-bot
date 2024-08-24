const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const ready = require('./ready.js'); // Importer le module ready.js

// Lire les configurations depuis config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent, // Nécessaire pour lire les messages du salon
  ]
});

const bots = config.bots; // Liste des bots avec leurs IDs et noms
const channelId = config.channelId;
const guildId = config.guildId;
const token = config.token;
const websites = config.websites; // Liste des sites avec noms et URLs

let statusMessage;
const botStartTime = Date.now(); // Temps de démarrage du bot

// Fonction pour générer le format de timestamp Discord
function getDiscordTimestamp() {
  return `<t:${Math.floor(Date.now() / 1000)}:R>`; // Timestamp Unix actuel
}

// Fonction pour calculer le temps écoulé depuis le démarrage en secondes
function getUptimeTimestamp() {
  const uptimeMs = Date.now() - botStartTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);
  return `<t:${Math.floor(Date.now() / 1000) - uptimeSeconds}:R>`; // Format de timestamp Discord
}

// Emoji pour les différents états
const emojis = {
  online: '<:greendot:1276694773255634995>',
  offline: '<:reddot:1276694697024163965>',
  notFound: '<a:emoji_33:1276694807095545918>'
};

// Charger le module ready.js
ready(client);

client.once('ready', () => {
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error('Salon non trouvé');
    return;
  }

  // Fonction pour vérifier le statut des bots et des sites web
  async function checkStatus() {
    try {
      const guild = client.guilds.cache.get(guildId); // Utiliser l'ID du serveur
      if (!guild) {
        console.error('Serveur non trouvé');
        return;
      }

      const members = await guild.members.fetch();

      // Créer la description combinée pour tous les bots
      let botsDescription = '';

      bots.forEach(bot => {
        const botMember = members.get(bot.id);
        const status = botMember ? (botMember.presence ? botMember.presence.status : 'offline') : 'offline';

        botsDescription += `**Nom du Bot**: ${bot.name}\n`;
        botsDescription += `**ID du Bot**: <:emoji_16:1276695004836003962> ${bot.id}\n`;
        botsDescription += `**Statut**: ${status === 'online' ? `${emojis.online} En ligne` : `${emojis.offline} Hors ligne`}\n`;
        botsDescription += '\n';
      });

      // Vérifier le statut des sites web
      let websiteStatuses = '';
      for (const site of websites) {
        let websiteStatus = 'Indisponible';
        try {
          const response = await axios.get(site.url);
          if (response.status === 200) {
            websiteStatus = `${emojis.online} En ligne`;
          }
        } catch (error) {
          websiteStatus = `${emojis.offline} Hors ligne`;
        }
        websiteStatuses += `**Site**: ${site.name}\n**URL**: <:web:1276694908639510660> ${site.url}\n**Statut**: ${websiteStatus}\n\n`;
      }

      // Créer l'embed avec tous les statuts
      const statusEmbed = new EmbedBuilder()
        .setTitle('Statut des Bots et Sites Web')
        .setDescription(`${botsDescription}\n\n${websiteStatuses}`)
        .addFields(
          { name: 'Dernière mise à jour <a:login:1276695214538358806>', value: getDiscordTimestamp() }, // Met à jour le timestamp
          { name: 'Uptime du Bot <:crvt:1275107806407561237>', value: getUptimeTimestamp() }, // Affiche le temps depuis le démarrage du bot sous forme de timestamp
          { name: 'Ping du Bot 🏓', value: `${client.ws.ping}ms` } // Affiche le ping du bot
        )
        .setColor('Blue'); // Choisis une couleur qui te convient

      // Créer un bouton avec un lien vers le dépôt GitHub
      const githubButton = new ButtonBuilder()
        .setLabel('Visitez le site pour le code')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/kitbot14/status-bot');

      // Créer un bouton avec un lien vers le site web
      const websiteButton = new ButtonBuilder()
        .setLabel('Visitez le site saturne')
        .setStyle(ButtonStyle.Link)
        .setURL('https://kitbot14.github.io/saturne-site'); // Met à jour l'URL du bouton si nécessaire
              
      const supportButton = new ButtonBuilder()
        .setLabel('Visitez le support')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/rV56PQXSdF'); // Met à jour l'URL du bouton si nécessaire

      // Créer une ligne d'action pour les boutons
      const row = new ActionRowBuilder().addComponents(githubButton, websiteButton, supportButton);

      // Envoyer ou mettre à jour le message de statut
      if (statusMessage) {
        // Met à jour le message existant
        await statusMessage.edit({ embeds: [statusEmbed], components: [row] });
      } else {
        // Envoie le nouveau message
        statusMessage = await channel.send({ embeds: [statusEmbed], components: [row] });
      }

    } catch (error) {
      console.error('Erreur lors de la vérification du statut des bots ou des sites:', error);
    }
  }

  // Vérifie le statut toutes les minutes (60000 millisecondes)
  setInterval(checkStatus, 60000);

  // Supprime et recrée le message toutes les heures (3600000 millisecondes)
  setInterval(async () => {
    if (statusMessage) {
      await statusMessage.delete();
      statusMessage = null; // Réinitialise le message pour qu'il soit recréé
    }
    await checkStatus(); // Vérifie et recrée le message
  }, 3600000);

  // Effectue une première vérification dès que le bot est prêt
  checkStatus();
});

client.login(token);

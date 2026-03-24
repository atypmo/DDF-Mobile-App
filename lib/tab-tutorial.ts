import { FontAwesome } from "@expo/vector-icons";

export type TutorialSlide = {
  key: string;
  icon: keyof typeof FontAwesome.glyphMap;
  titleEn: string;
  titleFr: string;
  summaryEn: string;
  summaryFr: string;
  howToEn: string;
  howToFr: string;
};

export const TAB_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    key: "home",
    icon: "home",
    titleEn: "Home",
    titleFr: "Accueil",
    summaryEn:
      "Your main dashboard with quick access to DFF highlights, videos, and upcoming events.",
    summaryFr:
      "Votre tableau principal avec un acces rapide aux points forts de DFF, aux videos et aux evenements a venir.",
    howToEn:
      "Start here to review updates, open About or Impact cards, and jump into featured content.",
    howToFr:
      "Commencez ici pour consulter les mises a jour, ouvrir les cartes A propos ou Impact et acceder au contenu en vedette.",
  },
  {
    key: "support",
    icon: "heartbeat",
    titleEn: "Support",
    titleFr: "Soutien",
    summaryEn:
      "A place to request mental health support and access urgent helplines.",
    summaryFr:
      "Un endroit pour demander du soutien en sante mentale et acceder a des lignes d'aide urgentes.",
    howToEn:
      "Fill in your name, phone, and support request, then submit the form or call one of the listed helplines.",
    howToFr:
      "Entrez votre nom, votre telephone et votre demande de soutien, puis envoyez le formulaire ou appelez l'une des lignes d'aide affichees.",
  },
  {
    key: "workout",
    icon: "users",
    titleEn: "Workout",
    titleFr: "Workout",
    summaryEn:
      "Find a workout partner, create your fitness profile, and filter available matches.",
    summaryFr:
      "Trouvez un partenaire d'entrainement, creez votre profil sportif et filtrez les profils disponibles.",
    howToEn:
      "Set up your workout profile first, then browse partners, apply filters, and use the swipe cards to pass or show interest.",
    howToFr:
      "Configurez d'abord votre profil sportif, puis parcourez les partenaires, appliquez des filtres et utilisez les cartes a glisser pour passer ou montrer votre interet.",
  },
  {
    key: "events",
    icon: "calendar",
    titleEn: "Events",
    titleFr: "Evenements",
    summaryEn:
      "Browse current and past DFF events, then open event details and ticket links.",
    summaryFr:
      "Consultez les evenements DFF en cours et passes, puis ouvrez les details et liens d'inscription.",
    howToEn:
      "Tap any event card to view the schedule, location, event type, and registration link when one is available.",
    howToFr:
      "Touchez une carte d'evenement pour voir l'horaire, le lieu, le type d'evenement et le lien d'inscription lorsqu'il est disponible.",
  },
  {
    key: "contact",
    icon: "phone",
    titleEn: "Contact",
    titleFr: "Contact",
    summaryEn:
      "Reach DFF directly for questions, partnerships, or general follow-up.",
    summaryFr:
      "Contactez directement DFF pour des questions, des partenariats ou un suivi general.",
    howToEn:
      "Use the email address or phone number on the page, or tap the message button to start contacting the team.",
    howToFr:
      "Utilisez l'adresse courriel ou le numero de telephone sur la page, ou touchez le bouton de message pour contacter l'equipe.",
  },
  {
    key: "settings",
    icon: "cog",
    titleEn: "Settings",
    titleFr: "Reglages",
    summaryEn:
      "Manage language, display mode, account tools, security options, and support shortcuts.",
    summaryFr:
      "Gerez la langue, le mode d'affichage, les outils du compte, les options de securite et les raccourcis d'assistance.",
    howToEn:
      "Open this tab any time you want to change preferences, manage SMS verification, or reopen the app tour.",
    howToFr:
      "Ouvrez cet onglet a tout moment pour modifier vos preferences, gerer la verification SMS ou relancer la visite guidee.",
  },
];

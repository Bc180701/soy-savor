export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

export const isIOSSafari = (): boolean => {
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const notOtherBrowsers = !/(CriOS|FxiOS|OPiOS|mercury)/i.test(ua);
  return iOS && webkit && notOtherBrowsers;
};

export const isIOSVersion16Plus = (): boolean => {
  const ua = window.navigator.userAgent;
  const match = ua.match(/OS (\d+)_/);
  if (match && match[1]) {
    return parseInt(match[1]) >= 16;
  }
  return false;
};

export const supportsNotifications = (): boolean => {
  return 'Notification' in window && 
         'serviceWorker' in navigator && 
         'PushManager' in window;
};

export const getPWAInstallPrompt = (): string => {
  if (isIOSSafari()) {
    return "Pour installer l'application :\n" +
           "1. Appuyez sur le bouton Partager (carré avec flèche) en bas\n" +
           "2. Faites défiler et sélectionnez 'Sur l'écran d'accueil'\n" +
           "3. Appuyez sur 'Ajouter'\n\n" +
           "⚠️ Les notifications fonctionneront uniquement après installation";
  }
  
  return "Pour installer l'application, utilisez le menu de votre navigateur et sélectionnez 'Installer l'application'.";
};

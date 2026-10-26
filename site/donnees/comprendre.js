// « Comprendre le mBot » : vidéos du cours (chapitres), QCM sur les chaînes d'information et d'énergie, et annexe
// des 7 fonctions à expliquer avec ses mots. Repris des documents du projet (chaines_info_energie.html,
// qcm_chaines.html, carnet de route).
//
// Vidéos : les fichiers sont dans le dossier du serveur où se trouve le raccourci de l'outil. Sur chaque poste,
// l'élève choisit ce dossier une fois ; l'outil y cherche les fichiers par leur nom.
definirComprendre({
  videos: [
    {
      id: 'ost', titre: 'C’est quoi un OST ?', duree: '1 min 44', fichier: 'OST-automatise.mp4',
      description: 'Rappel de la notion d’objet et système technique automatisé, avant de plonger dans le mBot.',
      groupes: [{ titre: '', chapitres: [[0, 'Introduction'], [25, 'Définition d’un OST'], [70, 'Exemple appliqué']] }],
    },
    {
      id: 'mbot', titre: 'Tout sur le mBot', duree: '27 min 29', fichier: 'mbot.mp4',
      description: 'Constitution, capteurs, actionneurs, puis chaîne d’information et d’énergie. Les chapitres mènent directement à ce qui vous intéresse.',
      aide: 'La 4ᵉ partie (« Chaîne d’information et d’énergie ») vous aide à expliquer les 7 fonctions.',
      groupes: [
        { titre: '1. Constitution du mBot', chapitres: [[10, 'Le châssis'], [25, 'Les roues'], [65, 'Les moteurs et le réducteur'], [99, 'La carte électronique'], [216, 'Modules complémentaires'], [273, 'Aperçu du détecteur de ligne noire']] },
        { titre: '2. Les capteurs', chapitres: [[294, 'C’est quoi un capteur ?'], [320, 'Le capteur à ultrasons'], [445, 'Le détecteur de ligne noire'], [597, 'Le capteur de luminosité'], [643, 'Le récepteur infrarouge'], [700, 'Le bouton poussoir'], [761, 'Les 5 capteurs']] },
        { titre: '3. Les actionneurs', chapitres: [[787, 'C’est quoi un actionneur ?'], [807, 'Les moteurs'], [920, 'Les LED RVB'], [1010, 'Le buzzer'], [1077, 'La LED infrarouge'], [1133, 'Les 6 actionneurs']] },
        { titre: '4. Chaîne d’information et d’énergie', chapitres: [[1146, 'Le mBot vu comme une boîte'], [1284, 'La chaîne d’information'], [1446, 'La chaîne d’énergie'], [1625, 'Conclusion générale']] },
      ],
    },
  ],
  qcm: [
    { theme: 'Vocabulaire', question: 'Que signifie l’acronyme OST, utilisé pour parler du mBot ?', choix: ['Objet Sur Télécommande', 'Objet et Système Technique', 'Outil Scientifique et Technologique', 'Ordinateur Sans Télécommunication'], bonne: 1 },
    { theme: 'Chaîne d’information', question: 'À quoi sert la chaîne d’information d’un objet technique ?', choix: ['À fournir l’énergie électrique nécessaire au fonctionnement', 'À transformer l’électricité en mouvement, lumière ou son', 'À acquérir, traiter et communiquer des informations', 'À stocker les pièces mécaniques de l’objet'], bonne: 2 },
    { theme: 'Chaîne d’énergie', question: 'À quoi sert la chaîne d’énergie d’un objet technique ?', choix: ['À détecter les obstacles et les lignes noires', 'À décider quelle action effectuer', 'À afficher un message à l’utilisateur', 'À fournir, distribuer et transformer l’énergie en mouvement, lumière ou son'], bonne: 3 },
    { theme: 'Chaîne d’information — ACQUÉRIR', question: 'Sur le mBot, quel composant illustre la fonction ACQUÉRIR ?', choix: ['Le buzzer', 'La batterie', 'Le capteur de ligne noire', 'Les roues'], bonne: 2 },
    { theme: 'Chaîne d’information — TRAITER', question: 'Quel composant du mBot illustre la fonction TRAITER ?', choix: ['La carte électronique (le microcontrôleur)', 'Les LED RVB', 'Le bouton poussoir', 'La batterie'], bonne: 0 },
    { theme: 'Chaîne d’information — COMMUNIQUER', question: 'Lequel de ces éléments illustre la fonction COMMUNIQUER sur le mBot ?', choix: ['Le capteur à ultrasons', 'Les LED RVB', 'La batterie', 'Le châssis'], bonne: 1 },
    { theme: 'Chaîne d’énergie — ALIMENTER', question: 'Quel élément alimente le mBot en énergie électrique ?', choix: ['Le capteur infrarouge', 'La batterie', 'Le microcontrôleur', 'Le buzzer'], bonne: 1 },
    { theme: 'Chaîne d’énergie — DISTRIBUER', question: 'Quelle fonction reçoit « les ordres » envoyés par la chaîne d’information ?', choix: ['ACQUÉRIR', 'TRAITER', 'DISTRIBUER', 'COMMUNIQUER'], bonne: 2 },
    { theme: 'Chaîne d’énergie — CONVERTIR', question: 'Quel composant illustre la fonction CONVERTIR sur le mBot ?', choix: ['Les moteurs, qui transforment l’électricité en mouvement', 'La batterie', 'Le capteur de ligne', 'La carte électronique'], bonne: 0 },
    { theme: 'Chaîne d’énergie — TRANSMETTRE', question: 'Quel composant illustre la fonction TRANSMETTRE sur le mBot ?', choix: ['Les roues, qui transmettent le mouvement au sol', 'Le buzzer', 'Le bouton poussoir', 'Le capteur à ultrasons'], bonne: 0 },
    { theme: 'Vocabulaire', question: 'Quelle est la différence entre un capteur et un actionneur ?', choix: ['Un capteur agit sur l’environnement, un actionneur le mesure', 'Un capteur mesure une grandeur, un actionneur agit sur l’environnement', 'Ce sont deux mots pour désigner la même chose', 'Un capteur consomme de l’énergie, pas l’actionneur'], bonne: 1 },
    { theme: 'Les capteurs du mBot', question: 'Le capteur à ultrasons du mBot sert à mesurer…', choix: ['La luminosité ambiante', 'La distance à un obstacle', 'La vitesse des moteurs', 'Le niveau de la batterie'], bonne: 1 },
    { theme: 'Les 2 chaînes', question: 'Que relie la flèche « Ordres » entre les deux chaînes ?', choix: ['Elle relie la chaîne d’énergie à la chaîne d’information', 'Elle relie la chaîne d’information à la chaîne d’énergie', 'Elle relie les deux moteurs entre eux', 'Elle n’existe pas sur un mBot'], bonne: 1 },
    { theme: 'Les 2 chaînes', question: 'Sans la fonction TRAITER, un mBot pourrait-il réagir à un obstacle détecté ?', choix: ['Oui, les capteurs suffisent seuls à faire réagir le mBot', 'Non, car c’est le programme qui décide quoi faire de l’information reçue', 'Oui, grâce à la batterie', 'Non, car il manque de lumière'], bonne: 1 },
    { theme: 'Synthèse', question: 'Sur un mBot qui suit une ligne noire, quel est l’enchaînement correct ?', choix: ['ACQUÉRIR → TRAITER → DISTRIBUER → CONVERTIR', 'DISTRIBUER → ACQUÉRIR → CONVERTIR → TRAITER', 'CONVERTIR → ACQUÉRIR → TRAITER → DISTRIBUER', 'TRAITER → CONVERTIR → ACQUÉRIR → DISTRIBUER'], bonne: 0 },
  ],
  // Annexe du carnet de route : expliquer avec ses mots ce que fait chaque bloc sur SON mBot.
  chaines: [
    { id: 'acquerir', chaine: 'information', fonction: 'ACQUÉRIR' },
    { id: 'traiter', chaine: 'information', fonction: 'TRAITER' },
    { id: 'communiquer', chaine: 'information', fonction: 'COMMUNIQUER' },
    { id: 'alimenter', chaine: 'energie', fonction: 'ALIMENTER' },
    { id: 'distribuer', chaine: 'energie', fonction: 'DISTRIBUER' },
    { id: 'convertir', chaine: 'energie', fonction: 'CONVERTIR' },
    { id: 'transmettre', chaine: 'energie', fonction: 'TRANSMETTRE' },
  ],
  aideChaines: 'Ne vous contentez pas de retrouver le bon mot : expliquez avec vos mots ce que fait chaque bloc sur VOTRE mBot (quel composant, quel signal, quel effet).',
});

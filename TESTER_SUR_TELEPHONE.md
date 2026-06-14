# Tester jeudi. sur ton iPhone (sur le WiFi)

But : voir l'app sur ton téléphone, en vrai, sans rien déployer.
Condition : **le PC et l'iPhone sur le MÊME WiFi** (même box).

---

## En 3 étapes

1. **Sur le PC**, ouvre un terminal dans le dossier `app` et lance :

   ```
   cd F:\ErsanMusa-com\Jeudi_App\app
   npm run dev:tel
   ```

   (`dev:tel` = le serveur, mais ouvert au réseau. Le `npm run dev` normal ne marche QUE sur le PC.)

2. Le terminal affiche les adresses. Prends la ligne **Network en `192.168.x`** :

   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://100.86.86.85:5173/    ← (ça c'est ton VPN/Tailscale, ignore)
   ➜  Network: http://192.168.1.135:5173/   ← CELLE-CI (ton WiFi)
   ```

   > S'il y a plusieurs lignes **Network**, prends toujours celle qui commence
   > par **`192.168.`** (ton réseau local). Si l'IP a changé (autre WiFi), c'est
   > cette ligne-là qui fait foi.

3. **Sur l'iPhone**, dans Safari, tape :

   ```
   http://192.168.1.135:5173
   ```

   L'app s'ouvre. 🎉

---

## L'installer comme une vraie app (icône sur l'écran d'accueil)

Dans Safari, sur la page de l'app :
**bouton Partager** (carré avec flèche) → **« Sur l'écran d'accueil »** → Ajouter.
Tu auras l'icône jeudi. en plein écran, comme une app.

---

## Tester le VRAI build (optimisé, comme en prod) — sur le WiFi

`npm run dev:tel` sert le mode développement. Pour tester **le build final**
(plus rapide, identique à la prod), sur le WiFi :

```
cd F:\ErsanMusa-com\Jeudi_App\app
npm run build
npm run preview:tel
```

Puis sur le tél : l'URL **Network en `192.168.x`** affichée (souvent
`http://192.168.1.135:4173`). Marche sur l'iPhone ET le Samsung, même WiFi.
(Toujours pas de GPS réel en `http://` → voir Vercel ci-dessous.)

---

## LE vrai test : Vercel (HTTPS → GPS réel, partout, sur les 2 tél)

Une vraie URL `https://…` : **géoloc GPS qui marche**, installable, accessible
**hors de chez toi** (pas besoin que le PC tourne). Marche iPhone 16 Pro Max +
Samsung, n'importe où.

1. Une seule fois, installe l'outil Vercel :
   ```
   npm i -g vercel
   ```
2. Dans le dossier `app`, connecte-toi puis déploie :
   ```
   cd F:\ErsanMusa-com\Jeudi_App\app
   vercel login      (ouvre le navigateur, connecte ton compte Vercel)
   vercel            (réponds Entrée à tout — il détecte Vite tout seul)
   ```
   À la fin il affiche une URL **Preview** (`https://app-xxxx.vercel.app`).
3. Pour une URL stable (à donner aux potes) :
   ```
   vercel --prod
   ```
4. Ouvre l'URL `https://…` sur tes deux tél → Safari/Chrome demandera
   l'autorisation de **localisation** : accepte → vraie distance depuis toi.
   Partager → « Sur l'écran d'accueil » = vraie app installée.

> Le `vercel.json` est déjà prêt dans `app/` (framework Vite + routes SPA).
> Astuce : à chaque fois que tu veux mettre à jour la version en ligne,
> relance juste `vercel --prod` depuis `app`.

---

## Bon à savoir

- **La géoloc GPS ne marchera pas** sur `http://…` (Safari la bloque hors HTTPS).
  → L'app le gère : elle se rabat sur **Place Vendôme** comme position par défaut.
  Les distances/durées sont donc calculées depuis Place Vendôme, pas depuis toi.
  La vraie géoloc viendra avec le **déploiement Vercel** (HTTPS) — chantier 7.

- **Ça ne charge pas ?**
  - Vérifie que les deux appareils sont sur le **même WiFi**.
  - Le **pare-feu Windows** peut bloquer : à la 1ʳᵉ exécution, autorise Node.js
    sur les réseaux privés si une fenêtre s'affiche.
  - Coupe un éventuel **VPN** sur le PC ou le téléphone.

- **Le port** est 5173 par défaut. S'il est pris, Vite en choisit un autre
  (5174…) — regarde la ligne **Network** dans le terminal.

- Pour **arrêter** le serveur : `Ctrl + C` dans le terminal.

---

*Pour partager hors de chez toi (montrer à un pote à distance) ou avoir la vraie
géoloc, il faudra déployer (Vercel). C'est le chantier « Sur ton iPhone ».*

export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { niche, cible, douleurs, resultats, differenciateur, idee, pillars, qty, mode } = req.body;

  if (mode === 'idee') {
    if (!idee || !niche || !cible) {
      return res.status(400).json({ error: 'Champs manquants' });
    }
  } else {
    if (!niche || !cible || !pillars || !qty) {
      return res.status(400).json({ error: 'Champs manquants' });
    }
  }

  const pillarDesc = {
    A: "Contenu ultra actionnable, valeur immédiate, résultat quasi instantané. L'objectif est que les gens enregistrent le Reel.",
    C: "Contenu qui chauffe la communauté et différencie. Opinions tranchées, méthodologie propre, désaccords avec le secteur.",
    V: "Contenu qui vend sans vendre frontalement. Preuves sociales, démontage d'objections, témoignages, résultats clients."
  };

  const timestamp = Date.now();
  const randomSeed = Math.random().toString(36).substring(7) + '-' + timestamp;

  let prompt;

  if (mode === 'idee') {
    prompt = `Tu es une experte en stratégie de contenu Instagram. Génère des hooks pour un post Instagram dont le sujet est défini, classés selon la méthode ACV.

Niche: ${niche}
Cible idéale: ${cible}
${douleurs ? `Douleurs de la cible: ${douleurs}` : ''}
${resultats ? `Résultats concrets: ${resultats}` : ''}
${differenciateur ? `Différenciateur: ${differenciateur}` : ''}
Sujet du post: ${idee}
Seed: ${randomSeed}

Piliers ACV:
- A (Attirer): hook actionnable, valeur immédiate, enregistrable
- C (Chauffer): opinion tranchée, différenciation, crée l'attachement
- V (Vendre): preuve sociale, résultat client, objection démontée

Génère 6 hooks (2 par pilier). Même sujet, approches et émotions différentes.

RÈGLES:
- 6 structures syntaxiques différentes
- JAMAIS deux hooks qui commencent pareil
- Zéro tiret, ton direct, français
- Dans la tête de la cible

JSON uniquement:
{
  "pillars": {
    "A": ["hook1", "hook2"],
    "C": ["hook1", "hook2"],
    "V": ["hook1", "hook2"]
  }
}`;
  } else {
    const pillarDetails = pillars.map(p => `Pilier ${p}: ${pillarDesc[p]}`).join('\n');
    prompt = `Tu es une experte en stratégie de contenu Instagram. Génère des hooks ultra percutants.

Niche: ${niche}
Cible: ${cible}
${douleurs ? `Douleurs: ${douleurs}` : ''}
${resultats ? `Résultats: ${resultats}` : ''}
${differenciateur ? `Différenciateur: ${differenciateur}` : ''}
Piliers: ${pillars.join(', ')}
Nombre par pilier: ${qty}
Seed: ${randomSeed}

${pillarDetails}

RÈGLES DIVERSITÉ — PRIORITÉ 1:
- Chaque hook = structure syntaxique différente (question, affirmation choc, confession, chiffre, mise en situation, révélation, contradiction...)
- JAMAIS deux hooks qui commencent par le même mot
- JAMAIS "Les X choses que..." plus d'une fois
- JAMAIS mad-lib (même template, mots swappés)
- Chaque hook = émotion différente (curiosité, surprise, peur de rater, fierté, provocation...)
- Zéro tiret, ton direct, français, dans la tête de la cible

RÈGLES PAR PILIER:
- A: actionnable, valeur immédiate, résultat concret
- C: opinion tranchée, différenciation forte, ton polarisant
- V: preuve sociale spécifique, objection démontée, transformation réelle

JSON uniquement:
{
  "pillars": {
    "A": ["hook1"],
    "C": ["hook1"],
    "V": ["hook1"]
  }
}
Piliers à inclure: ${pillars.join(', ')}`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      const type = data.error.type || '';
      if (type === 'overloaded_error') {
        return res.status(503).json({ error: 'Les serveurs sont momentanément surchargés. Réessaie dans 1 à 2 minutes.' });
      }
      if (type === 'rate_limit_error') {
        return res.status(429).json({ error: 'Trop de requêtes. Patiente quelques secondes et réessaie.' });
      }
      return res.status(500).json({ error: 'Une erreur est survenue. Réessaie dans quelques instants.' });
    }

    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur. Réessaie dans quelques instants.' });
  }
}

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
    A: "Contenu ultra actionnable, valeur immédiate, résultat quasi instantané. L'objectif est que les gens enregistrent le Reel. Chaque hook doit donner envie d'arrêter de scroller et d'enregistrer le contenu.",
    C: "Contenu qui chauffe la communauté et différencie. Opinions tranchées, méthodologie propre, désaccords avec le secteur. Ce qui crée l'attachement à la personne et pas juste au contenu.",
    V: "Contenu qui vend sans vendre frontalement. Preuves sociales, démontage d'objections, témoignages, résultats clients."
  };

  const timestamp = Date.now();
  const randomSeed = Math.random().toString(36).substring(7) + '-' + timestamp;

  let prompt;

  if (mode === 'idee') {
    prompt = `Tu es une experte en stratégie de contenu Instagram. Tu dois générer des hooks ultra percutants pour un post Instagram dont le sujet est déjà défini.

Niche: ${niche}
Cible idéale: ${cible}
${douleurs ? `Douleurs de la cible: ${douleurs}` : ''}
${resultats ? `Résultats concrets obtenus: ${resultats}` : ''}
${differenciateur ? `Ce qui différencie: ${differenciateur}` : ''}

Idée / sujet du post: ${idee}

Seed de variation: ${randomSeed}

OBJECTIF: Générer 5 hooks différents pour ce même sujet de post. Chaque hook doit amener vers le même contenu mais avec une approche, une émotion et une structure syntaxique complètement différentes.

RÈGLES ABSOLUES:
- 5 hooks pour le même sujet, 5 structures syntaxiques différentes
- Varie entre: question directe, affirmation choc, confession, chiffre précis, mise en situation, interpellation, révélation, contradiction, comparaison inattendue
- JAMAIS deux hooks qui commencent par le même mot
- Chaque hook déclenche une émotion différente: curiosité, surprise, peur de rater, identification, provocation
- Ton direct, punchy, en français, zéro tiret
- Se mettre vraiment dans la tête de la cible

Réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires:
{
  "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"]
}`;
  } else {
    const pillarDetails = pillars.map(p => `Pilier ${p}: ${pillarDesc[p]}`).join('\n');
    prompt = `Tu es une experte en stratégie de contenu Instagram. Tu dois générer des hooks Instagram ultra percutants.

Niche: ${niche}
Cible idéale: ${cible}
${douleurs ? `Douleurs principales de la cible: ${douleurs}` : ''}
${resultats ? `Résultats concrets obtenus par les clients: ${resultats}` : ''}
${differenciateur ? `Ce qui différencie de la concurrence: ${differenciateur}` : ''}
Piliers demandés: ${pillars.join(', ')}
Nombre d'idées par pilier: ${qty}
Seed de variation: ${randomSeed}

${pillarDetails}

RÈGLES ABSOLUES SUR LA DIVERSITÉ:
- Chaque hook doit avoir une STRUCTURE SYNTAXIQUE différente. Varie entre: question directe, affirmation choc, confession personnelle, chiffre précis, mise en situation, interpellation, révélation, contradiction, comparaison inattendue
- JAMAIS deux hooks qui commencent par le même mot ou la même construction
- JAMAIS le style "Les X choses que..." répété plus d'une fois
- JAMAIS du mad-lib: ne pas juste remplacer des mots dans un même template
- Chaque hook déclenche une ÉMOTION DIFFÉRENTE: curiosité, honte, surprise, peur de rater, fierté, soulagement, provocation, identification
- Tu te mets vraiment dans la tête de la cible pour écrire ce qui la ferait stopper son scroll
- Ton direct, punchy, en français, zéro tiret dans les hooks

RÈGLES PAR PILIER:
- Pilier A: actionnable et enregistrable, valeur immédiate, résultat concret
- Pilier C: opinion tranchée et assumée, ce qui différencie vraiment, ton fort et polarisant
- Pilier V: preuve sociale spécifique, objection démontée par les faits, transformation réelle

Réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires:
{
  "pillars": {
    "A": ["hook1", "hook2"],
    "C": ["hook1"],
    "V": ["hook1"]
  }
}
N'inclus que les piliers demandés: ${pillars.join(', ')}`;
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
        return res.status(429).json({ error: 'Trop de requêtes en même temps. Patiente quelques secondes et réessaie.' });
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

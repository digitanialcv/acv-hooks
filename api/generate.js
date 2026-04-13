export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { niche, cible, offre, pillars, qty } = req.body;

  if (!niche || !cible || !offre || !pillars || !qty) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const pillarDesc = {
    A: "Contenu ultra actionnable, valeur immédiate, résultat quasi instantané. L'objectif est que les gens enregistrent le Reel. Chaque hook doit donner envie d'arrêter de scroller et d'enregistrer le contenu.",
    C: "Contenu qui chauffe la communauté et différencie. Opinions tranchées, méthodologie propre, désaccords avec le secteur. Ce qui crée l'attachement à la personne et pas juste au contenu.",
    V: "Contenu qui vend sans vendre frontalement. Preuves sociales, démontage d'objections, témoignages, résultats clients."
  };

  const pillarDetails = pillars.map(p => `Pilier ${p}: ${pillarDesc[p]}`).join('\n');

  const randomSeed = Math.random().toString(36).substring(7);

  const prompt = `Tu es une experte en stratégie de contenu Instagram. Tu dois générer des hooks Instagram ultra percutants.

Niche: ${niche}
Cible idéale: ${cible}
Offre: ${offre}
Piliers demandés: ${pillars.join(', ')}
Nombre d'idées par pilier: ${qty}
Seed de variation: ${randomSeed}

${pillarDetails}

RÈGLES ABSOLUES SUR LA DIVERSITÉ — C'EST LA PRIORITÉ NUMÉRO 1:
- Chaque hook doit avoir une STRUCTURE SYNTAXIQUE différente des autres. Varie entre: question directe, affirmation choc, confession personnelle, chiffre précis, mise en situation, interpellation, révélation, contradiction, comparaison inattendue, etc.
- JAMAIS deux hooks qui commencent par le même mot ou la même construction
- JAMAIS le style "Les X choses que..." répété plus d'une fois
- JAMAIS du mad-lib: ne pas juste remplacer des mots dans un même template
- Chaque hook doit déclencher une ÉMOTION DIFFÉRENTE: curiosité, honte, surprise, peur de rater, fierté, soulagement, provocation, identification
- Tu dois te mettre dans la tête de la cible idéale et écrire ce qui la ferait VRAIMENT stopper son scroll à elle, pas une cible générique
- Utilise les détails spécifiques fournis dans la description de l'offre pour créer des hooks uniques et non reproductibles ailleurs
- Ton direct, punchy, en français, zéro tiret dans les hooks

RÈGLES PAR PILIER:
- Pilier A: actionnable et enregistrable, valeur immédiate, résultat concret
- Pilier C: opinion tranchée et assumée, ce qui différencie vraiment, ton fort et polarisant
- Pilier V: preuve sociale spécifique, objection démontée par les faits, transformation réelle

Réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires, ce format exact:
{
  "pillars": {
    "A": ["hook1", "hook2"],
    "C": ["hook1"],
    "V": ["hook1"]
  }
}
N'inclus que les piliers demandés: ${pillars.join(', ')}`;

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur, réessaie.' });
  }
}

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

  const prompt = `Tu es une experte en stratégie de contenu Instagram. Tu dois générer des hooks Instagram ultra percutants.

Niche: ${niche}
Cible idéale: ${cible}
Offre: ${offre}
Piliers demandés: ${pillars.join(', ')}
Nombre d'idées par pilier: ${qty}

${pillarDetails}

Règles absolues:
- Aucun tiret dans les hooks
- Hooks ultra originaux, jamais génériques
- Tu te mets vraiment dans la tête de la cible pour créer des hooks qui donnent envie d'arrêter de scroller
- Hooks en français, ton direct et punchy
- Pour le pilier A: contenu actionnable et enregistrable, valeur immédiate
- Pour le pilier C: opinion tranchée, différenciation, ton fort
- Pour le pilier V: preuve sociale, objection démontée, résultat client

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

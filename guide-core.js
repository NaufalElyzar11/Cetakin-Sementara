(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./guide-index.js'));
  else root.CetakinGuideCore = factory(root.CetakinGuides);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data) {
  'use strict';
  const guides = data.guides;
  const byId = new Map(guides.map((guide) => [guide.id, guide]));
  const byProduct = new Map(guides.flatMap((guide) => guide.products.map((id) => [id, guide])));
  function forProduct(product) {
    if (!product || product.type === 'gantungan-kunci' || (product.type && product.type !== 'robotika')) return null;
    // An optional guide_id column can map future SKUs to an existing, reviewed guide.
    if (product.guide_id) return byId.get(product.guide_id) || null;
    if (product.name) {
      const n = String(product.name).toUpperCase();
      if (n.includes('MQ-2')) return byId.get('mq-2') || null;
      if (n.includes('HC-SR501')) return byId.get('hc-sr501') || null;
      if (n.includes('SG90') || n.includes('SG-90')) return byId.get('sg90') || null;
      if (n.includes('L298')) return byId.get('l298n') || null;
      if (n.includes('GEARBOX')) return byId.get('motor-dc-gearbox') || null;
      if (n.includes('PCB ') || n.startsWith('PCB') || n.startsWith('WHEEL RODA')) return null;
    }
    return byProduct.get(product.id) || null;
  }
  function filter({ q = '', group = '' } = {}) {
    const normalize = (text) => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id');
    const terms = normalize(q).trim().split(/\s+/).filter(Boolean);
    return guides.filter((guide) => (!group || guide.group === group) && terms.every((term) => normalize([guide.title, guide.subtitle, ...guide.tags, ...guide.products].join(' ')).includes(term)));
  }
  return { guides, forProduct, filter, byId: (id) => byId.get(id) || null, href: (guide, prefix = './') => `${prefix}panduan/${guide.id}.html` };
});

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./guide-index.js'));
  else root.CetakinGuideCore = factory(root.CetakinGuides);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data) {
  'use strict';
  const guides = data.guides;
  const byId = new Map(guides.map((guide) => [guide.id, guide]));
  const byProduct = new Map(guides.flatMap((guide) => guide.shopProducts.map(({ id }) => [id, guide])));
  const shopByGuide = new Map(guides.map((guide) => [guide.id, guide.shopProducts.map(({ id, namePattern }) => ({
    id, model: new RegExp(namePattern, 'i'),
  }))]));
  const normalize = (text) => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id');

  function forProduct(product) {
    if (!product || product.type === 'gantungan-kunci' || (product.type && product.type !== 'robotika')) return null;
    // An optional guide_id column can map future SKUs to an existing, reviewed guide.
    if (product.guide_id) return byId.get(product.guide_id) || null;
    if (!product.name) return byProduct.get(product.id) || null;
    const name = normalize(product.name);
    if (/\bgearbox\b/.test(name)) return byId.get('motor-dc-gearbox') || null;
    return guides.find((guide) => shopByGuide.get(guide.id).some(({ model }) => model.test(name))) || null;
  }

  function resolveProduct(products, guideId, preferredId) {
    const variant = shopByGuide.get(guideId)?.find(({ id }) => id === preferredId);
    if (!variant) return null;
    const matching = products.filter((product) => product.type === 'robotika' && product.active !== false &&
      (!product.guide_id || product.guide_id === guideId) && variant.model.test(normalize(product.name)));
    return matching.find((product) => product.id === preferredId) || matching[0] || null;
  }

  function filter({ q = '', group = '' } = {}) {
    const terms = normalize(q).trim().split(/\s+/).filter(Boolean);
    return guides.filter((guide) => (!group || guide.group === group) && terms.every((term) => normalize([guide.title, guide.subtitle, ...guide.tags, ...guide.shopProducts.map(({ id }) => id)].join(' ')).includes(term)));
  }
  return { guides, forProduct, resolveProduct, filter, byId: (id) => byId.get(id) || null, href: (guide, prefix = './') => `${prefix}panduan/${guide.id}.html` };
});

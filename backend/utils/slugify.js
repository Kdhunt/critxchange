const baseSlugify = (value = '') => value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const slugify = (value, fallback = 'profile') => {
    const slug = baseSlugify(value);
    return slug || fallback;
};

module.exports = {
    slugify,
};

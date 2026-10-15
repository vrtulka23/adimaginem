// Keep Markdown usable in the repository while adapting its links for the site.
export function documentationLinks({ base = '/' } = {}) {
  const prefix = `${base.replace(/\/$/, '')}/`;
  return tree => {
    function walk(node) {
      if ((node.type === 'link' || node.type === 'definition') && node.url && !/^(?:[a-z]+:|#|\/)/i.test(node.url)) {
        const [path, fragment] = node.url.split('#');
        const suffix = fragment ? `#${fragment}` : '';
        if (path === '../tools/README.md') node.url = `${prefix}docs/running/${suffix}`;
        else if (/^(?:\.\/)?[^/]+\.md$/.test(path)) {
          const name = path.replace(/^\.\//, '').replace(/\.md$/, '');
          node.url = `${prefix}docs/${name === 'index' ? '' : `${name}/`}${suffix}`;
        } else if (path.startsWith('../')) {
          node.url = `https://github.com/vrtulka23/adimaginem/blob/main/${path.slice(3)}${suffix}`;
        }
      }
      for (const child of node.children || []) walk(child);
    }
    walk(tree);
  };
}

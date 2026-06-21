// Host-only / light-DOM components style their OWN element with scoped CSS-module
// classes (not tag/attribute selectors). They render no template, so they can't
// carry a class in markup — instead they apply it to the host imperatively in
// updated(). This helper syncs a managed set of classes onto the host: it adds
// the wanted ones and removes previously-applied ones that no longer apply,
// leaving any author-added classes on the element untouched.

export function syncHostClasses(
  el: Element,
  applied: Set<string>,
  next: ReadonlyArray<string | false | undefined | null>,
): void {
  const want = new Set<string>();
  for (const c of next) if (c) want.add(c);
  for (const c of applied) if (!want.has(c)) el.classList.remove(c);
  for (const c of want) el.classList.add(c);
  applied.clear();
  for (const c of want) applied.add(c);
}

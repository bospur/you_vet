Read the currently open TSX file (check the ide_opened_file context or ask the user to confirm which file if unclear).

1. Parse all `className` usages:
   - CSS module references: `styles.foo`, `styles.foo_bar`, `styles['foo-bar']`
   - clsx/classNames with module refs: `clsx(styles.foo, styles.bar)`

2. Map the JSX nesting structure — which classNames are children of which parent className elements.

3. Find the co-located `.module.css` file (same directory, same base name, `.module.css` extension).

4. Write all collected classNames into the `.module.css` preserving the JSX nesting as CSS nesting (using `& .child` syntax). Use the existing content in `.module.css` as a base — keep any classes already there, only add missing ones.

Rules:
- Each className becomes a CSS class block `.className { }`
- Child elements nest inside their parent's block using `& .childName { }`
- Do not add any CSS properties — empty blocks only
- Use the actual class name without the `styles.` prefix

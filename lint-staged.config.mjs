/** Pre-commit: ESLint только по staged файлам, конфиг того приложения, где они лежат. */
export default {
  'apps/{docs,admin,app,mobile}/**/*.{ts,tsx}': (filenames) => {
    const groups = new Map()

    for (const file of filenames) {
      const normalized = file.replaceAll('\\', '/')
      const workspace = workspaceOf(normalized)
      if (!workspace) continue
      const list = groups.get(workspace) ?? []
      list.push(file)
      groups.set(workspace, list)
    }

    return [...groups.entries()].map(([workspace, files]) => {
      const quoted = files.map((f) => `'${f.replaceAll("'", "'\\''")}'`).join(' ')
      return `npm exec --workspace=${workspace} -- eslint --max-warnings=0 ${quoted}`
    })
  },
}

function workspaceOf(file) {
  if (file.includes('/apps/docs/')) return '@you-vet/docs-portal'
  if (file.includes('/apps/admin/')) return 'vp-bot-admin'
  if (file.includes('/apps/app/')) return 'vp-bot-app'
  if (file.includes('/apps/mobile/')) return '@you-vet/mobile'
  return null
}

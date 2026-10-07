const { spawnSync } = require('node:child_process');
const compiler = require.resolve('typescript/bin/tsc');
for (const project of ['apps/api', 'apps/web', 'apps/worker', 'packages/types', 'packages/validation', 'packages/ui']) {
  const result = spawnSync(process.execPath, [compiler, '-p', `${project}/tsconfig.json`, '--noEmit'], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

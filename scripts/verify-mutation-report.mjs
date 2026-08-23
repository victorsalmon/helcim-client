import { readFile } from 'node:fs/promises';

const reportPath = new URL('../stryker-report/mutation/report.json', import.meta.url);
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const mutants = Object.values(report.files ?? {}).flatMap((file) => file.mutants ?? []);
const counts = mutants.reduce((acc, mutant) => {
  acc[mutant.status] = (acc[mutant.status] ?? 0) + 1;
  return acc;
}, {});
const total = mutants.length;
const killed = counts.Killed ?? 0;
const score = total ? (killed / (total - (counts.NoCoverage ?? 0))) * 100 : 0;
const disallowed = ['CompileError', 'RuntimeError', 'Timeout', 'Failed'];
const hasDisallowed = disallowed.some((status) => (counts[status] ?? 0) > 0);

console.log(`Mutation report: ${killed}/${total} killed; score ${score.toFixed(2)}%`);
for (const [status, count] of Object.entries(counts).sort()) console.log(`  ${status}: ${count}`);

// Stryker can return non-zero on Windows when it cannot taskkill a finished
// Vitest checker, even though the report is complete. Treat that cleanup-only
// exit as success, but never mask a real mutant execution failure.
if (hasDisallowed || score < 90) process.exit(1);

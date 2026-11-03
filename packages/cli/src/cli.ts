import { run } from './run';

const exitCode = await run(
  process.argv.slice(2),
  process.env,
  { log: (message) => console.log(message), error: (message) => console.error(message) },
);
process.exit(exitCode);

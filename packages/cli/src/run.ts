import { ArgsError, ArgsParser, USAGE } from './args';
import { MapCollector } from './collect-maps';
import { Output } from './interfaces';
import { SourceMapUploader } from './uploader';

const CLI_VERSION = '0.5.4';

export async function run(
  argv: string[],
  env: NodeJS.ProcessEnv,
  output: Output,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  try {
    const command = ArgsParser.parse(argv, env);
    if (command.kind === 'help') {
      output.log(USAGE);
      return 0;
    }
    if (command.kind === 'version') {
      output.log(CLI_VERSION);
      return 0;
    }

    const files = await MapCollector.collect(command.options.directory);
    if (files.length === 0) {
      output.error(`No .map files found in ${command.options.directory}`);
      return 1;
    }
    if (command.options.dryRun) {
      files.forEach((file) => output.log(`${file.relativePath} (${file.size} bytes)`));
      output.log(`Dry run: ${files.length} files would be uploaded for release ${command.options.release}`);
      return 0;
    }

    const summary = await new SourceMapUploader(command.options, output, fetchImpl).upload(files);
    output.log(`Done: ${summary.uploaded} source maps uploaded for release ${command.options.release}`);
    return 0;
  } catch (error) {
    output.error(error instanceof ArgsError || error instanceof Error ? error.message : String(error));
    return 1;
  }
}

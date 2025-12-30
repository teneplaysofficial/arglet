import pkg from "./package.json" with { type: "json" };

/**
 * Configuration options for Arglet.
 */
export interface ArgletOptions {
  /**
   * Enable verbose debug output.
   *
   * @default process.env.DEBUG
   */
  debug?: boolean;

  /**
   * Separator used to represent array values in CLI arguments.
   *
   * @default ","
   */
  arraySeparator?: "," | "|";
}

/**
 * A tiny helper that lets your CLI args lead you to victory.
 *
 * Arglet merges command-line flags into an existing configuration object, using the object itself as the source of truth.
 *
 * - Only keys that exist in the config are allowed
 * - Boolean flags support `--flag` / `--no-flag`
 * - Nested values are supported via dot notation
 * - Invalid flags value type fail loudly
 *
 * @template T Configuration object shape
 *
 *
 * @throws Error If a flag is used incorrectly
 *
 * @returns A new configuration object with CLI arguments applied
 *
 * @license Apache-2.0
 * @see https://github.com/teneplaysofficial/arglet
 * @since 1.0.0
 */
export default function arglet<T extends Record<string, unknown>>(
  /** Configuration object used as the schema */
  data: T,
): T;
export default function arglet<T extends Record<string, unknown>>(
  data: T,
  options: ArgletOptions,
): T;
export default function arglet<T extends Record<string, unknown>>(
  data: T,
  /**
   * @readonly
   *
   * @default "process.argv.slice(2)"
   */
  args: readonly string[],
): T;
export default function arglet<T extends Record<string, unknown>>(
  data: T,
  args: readonly string[],
  options: ArgletOptions,
): T;

export default function arglet<T extends Record<string, unknown>>(
  data: T,
  argsOrOptions?: readonly string[] | ArgletOptions,
  explicitOptions?: ArgletOptions,
): T {
  const result: T = structuredClone(data);
  let args: readonly string[] = process.argv.slice(2);
  let userOptions: ArgletOptions = {};

  if (Array.isArray(argsOrOptions)) {
    args = argsOrOptions;
    userOptions = explicitOptions ?? {};
  } else if (argsOrOptions && typeof argsOrOptions === "object") {
    userOptions = argsOrOptions as ArgletOptions;
  }

  const opts: Required<ArgletOptions> = {
    debug: Boolean(process.env.DEBUG),
    arraySeparator: ",",
    ...userOptions,
  };

  const COLORS = {
    reset: "\x1b[0m",
    gray: "\x1b[90m",
    cyan: "\x1b[36m",
  };

  const logger = {
    debug(message: string) {
      if (!opts.debug) return;

      console.debug(
        `${COLORS.gray}${pkg.displayName}${COLORS.reset} ` +
          `${COLORS.cyan}[debug]${COLORS.reset} ${message}`,
      );
    },
  };

  /**
   * Resolve a value from the configuration using dot-notation.
   */
  const resolveValueAtPath = (path: string): unknown => {
    return path.split(".").reduce<unknown>((current, key) => {
      if (current && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, result);
  };

  /**
   * Checks whether a given configuration path exists.
   */
  const hasConfigPath = (path: string): boolean =>
    resolveValueAtPath(path) !== undefined;

  /**
   * Assigns a value to a nested configuration path.
   */
  const assignValueAtPath = (path: string, value: unknown): void => {
    const segments = path.split(".");
    let currentNode: Record<string, unknown> = result;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment) return;

      if (i === segments.length - 1) {
        currentNode[segment] = value;
        return;
      }

      if (
        typeof currentNode[segment] !== "object" ||
        currentNode[segment] === null
      ) {
        currentNode[segment] = {};
      }

      currentNode = currentNode[segment] as Record<string, unknown>;
    }
  };

  /**
   * Parses and applies a single CLI flag.
   */
  const parseFlag = (flagName?: string, rawValue?: string): void => {
    if (!flagName) return;

    if (rawValue === undefined) {
      logger.debug(
        `No explicit value provided for "${flagName}". Treating as a potential boolean flag.`,
      );
    }

    const isDisabledFlag = flagName.startsWith("no-");
    const normalizedPath = isDisabledFlag ? flagName.slice(3) : flagName;

    if (!hasConfigPath(normalizedPath)) {
      logger.debug(`Ignoring unknown flag: --${flagName}`);
      return;
    }

    const existingValue = resolveValueAtPath(normalizedPath);
    const existingValueType = typeof existingValue;

    let parsedValue: unknown;

    if (isDisabledFlag) {
      if (existingValueType !== "boolean") {
        throw new Error(
          `--no-${normalizedPath} is only valid for boolean options`,
        );
      }
      parsedValue = false;
    } else if (rawValue === undefined) {
      if (existingValueType !== "boolean") {
        throw new Error(`--${normalizedPath} requires a value`);
      }
      parsedValue = true;
    } else if (
      typeof opts.arraySeparator === "string" &&
      rawValue.includes(opts.arraySeparator)
    ) {
      parsedValue = rawValue.split(opts.arraySeparator);
    } else {
      parsedValue = rawValue;
    }

    assignValueAtPath(normalizedPath, parsedValue);
  };

  // Argument loop
  for (let index = 0; index < args.length; index++) {
    let rawArgument = args[index];
    if (!rawArgument?.startsWith("--")) continue;

    rawArgument = rawArgument.slice(2);

    // --key=value
    if (rawArgument.includes("=")) {
      const [flagName, flagValue] = rawArgument.split("=");
      parseFlag(flagName, flagValue);
    }
    // --key value
    else {
      const nextToken = args[index + 1];
      const flagValue =
        nextToken && !nextToken.startsWith("--") ? nextToken : undefined;

      parseFlag(rawArgument, flagValue);
    }
  }

  // Output
  logger.debug(`Input:\n${JSON.stringify(data, null, 2)}`);
  logger.debug(`Resolved configuration:\n${JSON.stringify(result, null, 2)}`);

  return result;
}

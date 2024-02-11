type FlagType = "number" | "string" | "boolean";

type FlagTypeToLiteral<T extends FlagType> = T extends "number"
  ? number
  : T extends "string"
  ? string
  : T extends "boolean"
  ? boolean
  : never;

type FlagDefinition<T extends FlagType> = {
  type: T;
  default?: FlagTypeToLiteral<T>;
  description?: string;
};

type FlagDefinitions = Record<string, FlagDefinition<FlagType>>;

type FlagDefinitionsToValues<T extends FlagDefinitions> = {
  [K in keyof T]: FlagTypeToLiteral<T[K]["type"]>;
};

function getDefaultValue(type: FlagType): FlagTypeToLiteral<FlagType> {
  switch (type) {
    case "number":
      return 0;
    case "string":
      return "";
    case "boolean":
      return false;
  }
}

function getBitburnerFlags<
  Flags extends Record<string, FlagDefinition<FlagType>>
>(flags: Flags) {
  const bitburnerFlags: Bitburner.Flags = [];

  for (const [name, { default: defaultValue, type }] of Object.entries(flags)) {
    bitburnerFlags.push([name, defaultValue ?? getDefaultValue(type)]);
  }

  return bitburnerFlags;
}

interface AutocompleteConfig {
  servers: boolean;
}

function getAutocompleteFunction(
  bitburnerFlags: Bitburner.Flags,
  config?: AutocompleteConfig
) {
  return (data: Bitburner.AutocompleteData) => {
    data.flags(bitburnerFlags);

    let result: string[] = [];

    if (config?.servers) {
      result = result.concat(data.servers);
    }

    return result;
  };
}

const HELP_DEFINITION = {
  type: "boolean",
  default: false,
  description: "Show help",
} satisfies FlagDefinition<FlagType>;

/**
 * @example
    const flags = new Flags({
      foo: { type: "number", default: 0 },
      bar: { type: "string", default: "" },
    })
    export const autocomplete = flags.autocomplete({ servers: true });
    export function main(ns: Bitburner.NS) {
      const { _, foo, bar } = flags.parse(ns);
    }
 */
export class Flags<
  FlagsDefinitions extends Record<string, FlagDefinition<FlagType>>
> {
  #flags: FlagsDefinitions;
  #bitburnerFlags: Bitburner.Flags;

  autocomplete: (data: Bitburner.AutocompleteData) => string[];

  constructor(flagsDefinitions: FlagsDefinitions, config?: AutocompleteConfig) {
    this.#flags = flagsDefinitions;
    this.#bitburnerFlags = getBitburnerFlags({
      ...flagsDefinitions,
      help: HELP_DEFINITION,
    });
    this.autocomplete = getAutocompleteFunction(this.#bitburnerFlags, config);
  }

  #getHelp() {
    /*
    Example:
      ./$1 [options]

      Options:
        --foo number
        --bar string
        --enable
     */
    let help = "\n";
    for (const [
      name,
      { default: defaultValue, description, type },
    ] of Object.entries(this.#flags)) {
      if (type === "boolean") help += `  --${name}`;
      else help += `  --${name} ${type}`;

      let fullDescription = "";

      if (description) fullDescription += `${description}. `;

      if (defaultValue != null)
        fullDescription += `Default Value: ${String(defaultValue)}.`;

      if (fullDescription) help += `  ${fullDescription}`;

      help += "\n";
    }

    return help;
  }

  parse(ns: Bitburner.NS): FlagDefinitionsToValues<FlagsDefinitions> & {
    _: string[];
  } {
    const parsedFlags = ns.flags(this.#bitburnerFlags);
    if (parsedFlags.help) {
      ns.tprint(this.#getHelp());
      ns.exit();
    }
    // @ts-expect-error ignore
    return parsedFlags;
  }
}

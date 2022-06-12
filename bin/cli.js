#!/usr/bin/env node
import buble from "rollup-plugin-buble";
import includePaths from "rollup-plugin-includepaths";
import { basename, extname, resolve, join, dirname } from "path";
import yargs from "yargs";
import { watch as _watch, rollup as _rollup } from "rollup";
import jspiclPlugin from "./plugin.js";

const options = {
  input: {
    description: "Path to entry point",
    demandOption: true,
    requiresArg: true
  },
  output: {
    description: "Path the generated PICO-8 cardridge",
    demandOption: true,
    requiresArg: true
  },
  spritesheetImagePath: {
    description: "Path to a spritesheet",
    demandOption: true,
    requiresArg: true
  },
  cartridgePath: {
    demandOption: true,
    description: "Path to existing cardridge",
    requiresArg: true
  },

  includeBanner: {
    description: "Include jspicl info in code",
    requiresArg: true
  },
  jsOutput: {
    description: "Path to JavaScript output"
  },
  luaOutput: {
    description: "Path to LUA output"
  },
  showStats: {
    description: "Display build stats",
    requiresArg: true
  },
  pipeOutputToConsole: {
    description: "Output console.log to terminal"
  },
  reloadOnSave: {
    description: "Re-run cartridge when updated"
  },

  polyfillTransform: {
    description: "Path to a module that exports a transformation method",
    requiresArg: true
  },
  customPicoPath: {
    description: "Path to PICO-8 executable",
    requiresArg: true
  },
  prettify: {
    description: "Format LUA code"
  },
  watch: {
    description: "Reload cartridge on rebuilds"
  }
  // customMappers: {
  //
  //   requiresArg: true,
  //   coerce: p => require(path.resolve(p)).default
  // }
};

const config = yargs.option(options)
  .strict()
  .help(false)
  .version(false)
  .wrap(null)
  .argv;

if (config.jsOutput && typeof config.jsOutput === "boolean") {
  const filename = basename(config.output, extname(config.output));
  config.jsOutput = resolve(join(dirname(config.output), `${filename}.js`));
}

if (config.luaOutput && typeof config.luaOutput === "boolean") {
  const filename = basename(config.output, extname(config.output));
  config.luaOutput = resolve(join(dirname(config.output), `${filename}.lua`));
}

function getInputOptions({ input, output, ...jspiclOptions }) {
  return {
    input,
    plugins: [
      includePaths({
        paths: [resolve(input)]
      }),
      buble({
        transforms: {
          classes: false,
        }
      }),
      {
        renderChunk: source => source.replace(/\/\/ <!-- DEBUG[^//]*\/\/\s-->/g, "")
      },
      jspiclPlugin(jspiclOptions)
    ]
  };
}

function getOutputOptions({ output }) {
  return {
    file: output,
    format: "esm",
    freeze: false
  };
}

function getWatchOptions(config) {
  return {
    ...getInputOptions(config),
    output: [getOutputOptions(config)],
    watch: {
      clearScreen: true,
      chokidar: true,
      exclude: "node_modules/**"
    }
  };
}

(async function build() {
  try {
    if (config.watch) {
      console.clear();
      _watch(getWatchOptions(config));
    }
    else {
      const bundle = await _rollup(getInputOptions(config));
      await bundle.write(getOutputOptions(config));
    }
  }
  catch (e) {
    console.error(e.message);
  }
})();
